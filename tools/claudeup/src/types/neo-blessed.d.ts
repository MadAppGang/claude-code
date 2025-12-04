/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'neo-blessed' {
  namespace blessed {
    interface Widgets {
      Screen: any;
      BoxElement: any;
      ListElement: any;
      TextboxElement: any;
      FormElement: any;
      TextElement: any;
    }

    interface ScreenOptions {
      smartCSR?: boolean;
      title?: string;
      fullUnicode?: boolean;
    }

    interface StyleOptions {
      fg?: string;
      bg?: string;
      bold?: boolean;
      border?: {
        fg?: string;
        bg?: string;
      };
      selected?: {
        fg?: string;
        bg?: string;
        bold?: boolean;
      };
      focus?: {
        border?: {
          fg?: string;
        };
      };
    }

    interface BorderOptions {
      type?: 'line' | 'bg';
      ch?: string;
      fg?: string;
      bg?: string;
    }

    interface BaseOptions {
      parent?: any;
      top?: number | string;
      left?: number | string;
      right?: number | string;
      bottom?: number | string;
      width?: number | string;
      height?: number | string;
      content?: string;
      tags?: boolean;
      border?: BorderOptions;
      style?: StyleOptions;
      padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
      label?: string;
    }

    interface BoxOptions extends BaseOptions {
      scrollable?: boolean;
      scrollbar?: {
        ch?: string;
        style?: StyleOptions;
      };
    }

    interface ListOptions extends BoxOptions {
      items?: string[];
      keys?: boolean;
      vi?: boolean;
      mouse?: boolean;
    }

    interface TextboxOptions extends BaseOptions {
      inputOnFocus?: boolean;
      value?: string;
    }

    interface FormOptions extends BaseOptions {
      keys?: boolean;
    }

    interface Node {
      type: string;
      destroy(): void;
      focus(): void;
      key(keys: string[], callback: () => void): void;
      on(event: string, callback: (...args: any[]) => void): void;
    }

    interface Screen extends Node {
      render(): void;
      children: Node[];
      key(keys: string[], callback: () => void): void;
    }

    interface BoxElement extends Node {
      setContent(content: string): void;
    }

    interface ListElement extends Node {
      selected: number;
      getValue(): string;
    }

    interface TextboxElement extends Node {
      getValue(): string;
      setValue(value: string): void;
    }

    interface FormElement extends Node {}

    interface TextElement extends Node {}

    function screen(options?: ScreenOptions): Screen;
    function box(options?: BoxOptions): BoxElement;
    function list(options?: ListOptions): ListElement;
    function textbox(options?: TextboxOptions): TextboxElement;
    function form(options?: FormOptions): FormElement;
    function text(options?: BaseOptions): TextElement;
  }

  export = blessed;
}
