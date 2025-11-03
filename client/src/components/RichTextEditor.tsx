import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { TwitterEmbed } from "./editor-extensions/TwitterEmbed";
import { ImageGallery } from "./editor-extensions/ImageGallery";
import { VideoEmbed } from "./editor-extensions/VideoEmbed";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Code2,
  Palette,
  Smile,
  Twitter,
  Images,
  Youtube as YoutubeIcon,
  Video,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editorRef?: (editor: Editor | null) => void;
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "ابدأ الكتابة...",
  editorRef 
}: RichTextEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [twitterDialogOpen, setTwitterDialogOpen] = useState(false);
  const [twitterUrl, setTwitterUrl] = useState("");
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState("");
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-md my-4",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      TextStyle,
      Color,
      TwitterEmbed,
      ImageGallery,
      VideoEmbed,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[300px] px-4 py-3",
        dir: "rtl",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [editor]);

  useEffect(() => {
    if (editorRef) {
      editorRef(editor);
    }
    return () => {
      if (editorRef) {
        editorRef(null);
      }
    };
  }, [editor, editorRef]);

  const handleSetLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setLinkDialogOpen(false);
    }
  };

  const handleUnsetLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  };

  const handleAddImage = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setImageDialogOpen(false);
    }
  };

  const handleAddTwitter = () => {
    if (twitterUrl && editor) {
      editor.chain().focus().setTwitterEmbed({ url: twitterUrl }).run();
      setTwitterUrl("");
      setTwitterDialogOpen(false);
    }
  };

  const handleAddGallery = () => {
    if (galleryUrls && editor) {
      const images = galleryUrls.split('\n').filter(url => url.trim() !== '');
      editor.chain().focus().setImageGallery({ images }).run();
      setGalleryUrls("");
      setGalleryDialogOpen(false);
    }
  };

  const handleAddYoutube = () => {
    if (youtubeUrl && editor) {
      const result = editor.chain().focus().setVideoEmbed({ url: youtubeUrl }).run();
      if (result) {
        setYoutubeUrl("");
        setYoutubeDialogOpen(false);
      } else {
        alert("رابط الفيديو غير صحيح. يرجى التأكد من أن الرابط من YouTube أو Dailymotion.");
      }
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (editor) {
      editor.chain().focus().insertContent(emojiData.emoji).run();
      setEmojiPickerOpen(false);
    }
  };

  const textColors = [
    { name: 'أسود', value: '#000000' },
    { name: 'أحمر', value: '#ef4444' },
    { name: 'أزرق', value: '#3b82f6' },
    { name: 'أخضر', value: '#22c55e' },
    { name: 'أصفر', value: '#eab308' },
    { name: 'برتقالي', value: '#f97316' },
    { name: 'بنفسجي', value: '#a855f7' },
    { name: 'وردي', value: '#ec4899' },
  ];

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    disabled?: boolean; 
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 p-0"
      title={title}
      data-testid={`button-${title.replace(/\s+/g, '-')}`}
    >
      {children}
    </Button>
  );

  return (
    <div className="border rounded-md" dir="rtl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="عريض"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="مائل"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="تحته خط"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="يتوسطه خط"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="كود"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        {/* Text Color */}
        <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="لون النص"
              data-testid="button-text-color"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60">
            <div className="grid grid-cols-4 gap-2">
              {textColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className="h-8 w-8 rounded border hover-elevate"
                  style={{ backgroundColor: color.value }}
                  onClick={() => {
                    editor.chain().focus().setColor(color.value).run();
                    setColorPickerOpen(false);
                  }}
                  title={color.name}
                  data-testid={`color-${color.name}`}
                />
              ))}
              <button
                type="button"
                className="h-8 w-8 rounded border bg-card hover-elevate flex items-center justify-center text-xs"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setColorPickerOpen(false);
                }}
                title="إزالة اللون"
                data-testid="color-reset"
              >
                ×
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title="عنوان 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="عنوان 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title="عنوان 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="قائمة نقطية"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="قائمة مرقمة"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          title="كتلة كود"
        >
          <Code2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="اقتباس"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="محاذاة لليمين"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="محاذاة للوسط"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="محاذاة لليسار"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href;
            setLinkUrl(previousUrl || "");
            setLinkDialogOpen(true);
          }}
          isActive={editor.isActive("link")}
          title="إضافة رابط"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => setImageDialogOpen(true)}
          title="إضافة صورة"
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => setGalleryDialogOpen(true)}
          title="ألبوم صور"
        >
          <Images className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => setYoutubeDialogOpen(true)}
          title="فيديو يوتيوب"
        >
          <YoutubeIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => setTwitterDialogOpen(true)}
          title="تغريدة"
        >
          <Twitter className="h-4 w-4" />
        </ToolbarButton>

        {/* Emoji Picker */}
        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="إيموجي"
              data-testid="button-emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0" align="start" side="bottom">
            <div className="rounded-md overflow-hidden">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                searchPlaceHolder="بحث..."
                width={350}
                height={350}
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
                searchDisabled={false}
                lazyLoadEmojis={true}
              />
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="تراجع"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="إعادة"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة رابط</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">عنوان الرابط (URL)</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                dir="ltr"
                data-testid="input-link-url"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editor.isActive("link") && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleUnsetLink();
                  setLinkDialogOpen(false);
                }}
                data-testid="button-remove-link"
              >
                إزالة الرابط
              </Button>
            )}
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSetLink} disabled={!linkUrl} data-testid="button-add-link">
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة صورة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">رابط الصورة (URL)</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                dir="ltr"
                data-testid="input-image-url"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddImage} disabled={!imageUrl} data-testid="button-add-image">
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Twitter Dialog */}
      <Dialog open={twitterDialogOpen} onOpenChange={setTwitterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة تغريدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="twitter-url">رابط التغريدة</Label>
              <Input
                id="twitter-url"
                placeholder="https://twitter.com/username/status/1234567890"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                dir="ltr"
                data-testid="input-twitter-url"
              />
              <p className="text-xs text-muted-foreground">
                الصق رابط التغريدة من تويتر (X) وستظهر التغريدة كاملة في المحتوى
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTwitterDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddTwitter} disabled={!twitterUrl} data-testid="button-add-twitter">
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Gallery Dialog */}
      <Dialog open={galleryDialogOpen} onOpenChange={setGalleryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة ألبوم صور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gallery-urls">روابط الصور (كل رابط في سطر منفصل)</Label>
              <Textarea
                id="gallery-urls"
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
                value={galleryUrls}
                onChange={(e) => setGalleryUrls(e.target.value)}
                dir="ltr"
                rows={6}
                data-testid="input-gallery-urls"
              />
              <p className="text-xs text-muted-foreground">
                أدخل رابط كل صورة في سطر منفصل. سيتم عرض الصور في شبكة منظمة.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setGalleryDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddGallery} disabled={!galleryUrls} data-testid="button-add-gallery">
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* YouTube Dialog */}
      <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة فيديو</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">رابط الفيديو (YouTube أو Dailymotion)</Label>
              <Input
                id="youtube-url"
                placeholder="https://www.youtube.com/watch?v=... أو https://www.dailymotion.com/video/..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                dir="ltr"
                data-testid="input-youtube-url"
              />
              <p className="text-xs text-muted-foreground">
                يدعم روابط YouTube و Dailymotion
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setYoutubeDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddYoutube} disabled={!youtubeUrl} data-testid="button-add-youtube">
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
