import { Node, mergeAttributes } from '@tiptap/core';

export interface TwitterEmbedOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    twitterEmbed: {
      setTwitterEmbed: (options: { url: string }) => ReturnType;
    };
  }
}

export const TwitterEmbed = Node.create<TwitterEmbedOptions>({
  name: 'twitterEmbed',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      url: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-twitter-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Don't hardcode theme - it will be set at view-time based on reader's preference
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-twitter-embed': '',
        class: 'twitter-embed-wrapper my-4',
      }),
      [
        'blockquote',
        {
          class: 'twitter-tweet',
          'data-lang': 'ar',
          'data-dnt': 'true',
          // Theme will be set dynamically before rendering
        },
        [
          'p',
          { dir: 'ltr', lang: 'ar' },
          'جارٍ تحميل التغريدة...',
        ],
        [
          'a',
          {
            href: HTMLAttributes.url,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          'عرض التغريدة',
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setTwitterEmbed:
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
