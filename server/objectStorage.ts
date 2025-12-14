// Reference: javascript_object_storage blueprint
import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }

    return null;
  }

  async downloadObject(file: File, res: Response, cacheTtlSec?: number) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      
      // Determine content type with validation
      const contentType = metadata.contentType || "application/octet-stream";
      
      // Only treat as image if content type is explicitly an image type
      const validImageTypes = [
        'image/webp', 'image/png', 'image/jpeg', 'image/jpg', 
        'image/gif', 'image/svg+xml', 'image/avif'
      ];
      const isImage = validImageTypes.includes(contentType.toLowerCase());
      const isWebP = contentType.toLowerCase() === "image/webp";
      
      // Cache durations:
      // - WebP images: 1 year (optimized, immutable content)
      // - Other images: 1 week
      // - Other files: 1 hour
      let defaultCacheTtl = 3600; // 1 hour default
      let useImmutable = false;
      
      if (isImage) {
        if (isWebP) {
          defaultCacheTtl = 31536000; // 1 year
          useImmutable = true;
        } else {
          defaultCacheTtl = 604800; // 1 week
        }
      }
      
      const finalCacheTtl = cacheTtlSec ?? defaultCacheTtl;
      
      const headers: Record<string, string | number> = {
        "Content-Type": contentType,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${finalCacheTtl}${useImmutable ? ", immutable" : ""}`,
      };
      
      // Add Content-Length if available
      if (metadata.size) {
        headers["Content-Length"] = metadata.size;
      }
      
      // Add ETag for conditional requests (helps with caching validation)
      if (metadata.etag) {
        headers["ETag"] = metadata.etag;
      }
      
      // Add Vary header for content negotiation on images
      if (isImage) {
        headers["Vary"] = "Accept";
      }
      
      res.set(headers);

      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  async uploadFile(
    path: string,
    buffer: Buffer,
    contentType: string,
    visibility: "public" | "private" = "private"
  ): Promise<{ url: string; path: string }> {
    // Use public or private directory based on visibility
    const baseDir = visibility === "public" 
      ? this.getPublicObjectSearchPaths()[0] 
      : this.getPrivateObjectDir();
    
    if (!baseDir) {
      throw new Error(
        `${visibility === "public" ? "PUBLIC_OBJECT_SEARCH_PATHS" : "PRIVATE_OBJECT_DIR"} not set. ` +
        "Create a bucket in 'Object Storage' tool and set the env var."
      );
    }

    const fullPath = `${baseDir}/${path}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    await file.save(buffer, {
      metadata: {
        contentType,
      },
    });

    // For public files in the public/ directory, they're automatically accessible
    // No need to call makePublic() as Replit Object Storage doesn't allow it
    
    return {
      url: `https://storage.googleapis.com/${bucketName}/${objectName}`,
      path: fullPath,
    };
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    
    // Use actual bucket ID directly to avoid alias resolution issues
    const actualBucketId = 'replit-objstore-3dc2325c-bbbe-4e54-9a00-e6f10b243138'; // Hardcoded bucket where correspondent files exist
    const objectName = `.private/${entityId}`;
    
    const bucket = objectStorageClient.bucket(actualBucketId);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    console.log("[ObjectStorage] normalizeObjectEntityPath - Input:", rawPath);
    
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      console.log("[ObjectStorage] Not a GCS URL, returning as-is");
      return rawPath;
    }

    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    console.log("[ObjectStorage] URL pathname:", rawObjectPath);

    let objectEntityDir = this.getPrivateObjectDir();
    console.log("[ObjectStorage] Private dir:", objectEntityDir);
    
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    console.log("[ObjectStorage] Private dir with slash:", objectEntityDir);

    if (!rawObjectPath.startsWith(objectEntityDir)) {
      console.log("[ObjectStorage] Path doesn't start with private dir, returning pathname");
      return rawObjectPath;
    }

    const entityId = rawObjectPath.slice(objectEntityDir.length);
    const result = `/objects/${entityId}`;
    console.log("[ObjectStorage] Normalized to:", result);
    return result;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    
    // If visibility is public, move file from .private to public directory
    if (aclPolicy.visibility === "public") {
      const privateDir = this.getPrivateObjectDir();
      const publicPaths = this.getPublicObjectSearchPaths();
      const publicDir = publicPaths[0]; // Use first public path
      
      // Get the relative path (e.g., "uploads/xxx")
      // objectFile.name is like ".private/uploads/xxx", we want just "uploads/xxx"
      const relativePath = objectFile.name.replace('.private/', '');
      
      // Create new public path
      const newObjectName = `public/${relativePath}`;
      const newFile = objectStorageClient.bucket(objectFile.bucket.name).file(newObjectName);
      
      console.log("[ObjectStorage] Moving file from private to public:");
      console.log("  From:", objectFile.name);
      console.log("  To:", newObjectName);
      
      // Copy file to public location
      await objectFile.copy(newFile);
      
      // Set ACL policy in metadata
      await setObjectAclPolicy(newFile, aclPolicy);
      
      // Delete original private file
      await objectFile.delete();
      
      // Return public object path (served via /public-objects/ route)
      const publicPath = `/public-objects/${relativePath}`;
      console.log("[ObjectStorage] Returning public path:", publicPath);
      return publicPath;
    }
    
    // For private files, just set ACL
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
