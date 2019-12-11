import { QuillTheme } from '../../../components/Quill/interfaces/QuillTheme';
import { IResourceProvider } from '../IResourceProvider';
import { cdnProviderRegistry } from './CdnProviderRegistry/index';
import quillScript from './endpoints/resources/quill.min.js.txt';
import highlightjsStyleSheet from './endpoints/resources/default.min.css.txt';
import highlightjs from './endpoints/resources/highlight.min.js.txt';
import bubbleThemeStyleSheet from './endpoints/resources/quill.bubble.min.css.txt';
import coreThemeStyleSheet from './endpoints/resources/quill.core.min.css.txt';
import snowThemeStyleSheet from './endpoints/resources/quill.snow.min.css.txt';
import loadLocalResource from 'react-native-local-resource'


export class OnlineResourceProvider implements IResourceProvider {
  public async getQuillScript(): Promise<string> {
    let data = await loadLocalResource(quillScript);
    return data
  }
  public async getHightlightJSScript(): Promise<string> {
    let data = await loadLocalResource(highlightjs);
    return data
  }
  public async getHighlightJSstyleSheet(): Promise<string> {
    let data = await loadLocalResource(highlightjsStyleSheet);
    return data
  }
  public async getQuillStyleSheet(theme: QuillTheme): Promise<string> {
    switch (theme) {
      case QuillTheme.BUBBLE: {
        let data = await loadLocalResource(bubbleThemeStyleSheet);
        return data
      }
      case QuillTheme.SNOW: {
        let data = await loadLocalResource(snowThemeStyleSheet);
        return data
      }
      default: { 
        let data = await loadLocalResource(coreThemeStyleSheet);
        return data
      }
    }
  }

  private async fetchResourceAsText(endpoint: string): Promise<string> {
    const response = await fetch(endpoint);
    return response.text();
  }
}
