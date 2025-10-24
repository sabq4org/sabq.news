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
        parseHTML: (element) => element.getAttribute('data-url'),
        renderHTML: (attributes) => {
          if (!attributes.url) {
            return {};
          }
          return {
            'data-url': attributes.url,
          };
        },
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

  renderHTML({ node, HTMLAttributes }) {
    const url = node.attrs.url || '';
    
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-twitter-embed': '',
        class: 'twitter-embed-wrapper my-6 border rounded-lg p-4 bg-muted/30',
      }),
      [
        'blockquote',
        {
          class: 'twitter-tweet',
          'data-lang': 'ar',
          'data-dnt': 'true',
        },
        [
          'p',
          {
            lang: 'ar',
            dir: 'rtl',
          },
          'جاري تحميل التغريدة...',
        ],
        [
          'a',
          {
            href: url,
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
