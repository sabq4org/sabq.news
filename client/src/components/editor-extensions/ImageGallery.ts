import { Node, mergeAttributes } from '@tiptap/core';

export interface ImageGalleryOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageGallery: {
      setImageGallery: (options: { images: string[] }) => ReturnType;
    };
  }
}

export const ImageGallery = Node.create<ImageGalleryOptions>({
  name: 'imageGallery',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (element) => {
          const imagesAttr = element.getAttribute('data-images');
          return imagesAttr ? JSON.parse(imagesAttr) : [];
        },
        renderHTML: (attributes) => {
          if (!attributes.images || attributes.images.length === 0) {
            return {};
          }
          return {
            'data-images': JSON.stringify(attributes.images),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-image-gallery]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const images = HTMLAttributes.images || [];
    
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-image-gallery': '',
        class: 'image-gallery my-6',
      }),
      [
        'div',
        { class: 'grid grid-cols-2 md:grid-cols-3 gap-2' },
        ...images.map((src: string) => [
          'img',
          {
            src,
            class: 'w-full h-auto rounded-md object-cover aspect-square hover:scale-105 transition-transform cursor-pointer',
            alt: 'صورة من الألبوم',
          },
        ]),
      ],
    ];
  },

  addCommands() {
    return {
      setImageGallery:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
