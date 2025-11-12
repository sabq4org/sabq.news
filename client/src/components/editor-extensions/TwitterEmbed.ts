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
    // Detect dark mode from document
    const isDark = typeof window !== 'undefined' && 
                   document.documentElement.classList.contains('dark');
    
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
          'data-theme': isDark ? 'dark' : 'light',
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
