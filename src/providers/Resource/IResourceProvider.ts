import { QuillTheme } from '../../components/Quill/interfaces/QuillTheme';

export interface IResourceProvider {
  getQuillScript: () => Promise<string>;
  getHightlightJSScript: () => Promise<string>;
  getQuillStyleSheet: (theme: QuillTheme) => Promise<string>;
}
