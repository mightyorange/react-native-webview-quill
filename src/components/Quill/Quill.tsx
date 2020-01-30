import { DeltaStatic } from 'quill-delta';
import * as React from 'react';
import { ActivityIndicator, View, ViewStyle, WebView as ReactNativeWebView } from 'react-native';
import { WebView as CommunityWebView } from '@types/react-native-webview';
import { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import { providerRegistry } from '../../ProviderRegistry/index';
import { EventType, IMessage } from './interfaces/IMessage';
import { generateWebViewIndex } from './resources/generateWebViewIndex';
import * as RNFS from 'react-native-fs';

interface IProps {
  accessibilityLabel?: string;
  editorStyle?: string;
  containerStyle?: ViewStyle;
  content?: DeltaStatic;
  onContentChange?: (content: DeltaStatic) => any;
  webviewRef?: ()=>any;
  openCloudEditor?: boolean;
  options?: string;
  injectedJavaScript?: string
}

interface IState {
  html: string | null;
}
type WebViewRef = ReactNativeWebView | CommunityWebView | null;

export class Quill extends React.Component<IProps, IState> {
  private WebViewComponent = providerRegistry.WebViewProvider;
  private ResourceProvider = new providerRegistry.ResourceProvider();
  private ThemeProvider = providerRegistry.ThemeProvider;
  private webView: WebViewRef = null;

  private fullHeightStyle: ViewStyle = {
    flex: 1,
  };

  private webViewStyle: ViewStyle = {
    ...this.fullHeightStyle,
    backgroundColor: 'rgba(0,0,0,0)',
  };

  constructor(props: any) {
    super(props);
    this.state = {
      html: null,
    };

    this.onMessage = this.onMessage.bind(this);
    this.loadResources();
  }

  public shouldComponentUpdate(newProps: IProps, newState: IState) {
    if (newProps.content !== this.props.content) {
      this.sendMessage(EventType.CONTENT_CHANGE, newProps.content);
    }
    if (newProps.openCloudEditor !== this.props.openCloudEditor) {
      this.sendMessage(EventType.OPEN_CLOUD_EDITOR, newProps.openCloudEditor);
    }

    return (
      newState.html !== this.state.html || newProps.containerStyle != this.props.containerStyle
    );
  }


  public render() {
    return (
      <View accessibilityLabel={this.props.accessibilityLabel} style={this.props.containerStyle}>
        {this.state.html === null ? (
          <ActivityIndicator size="large" style={this.fullHeightStyle} />
        ) : (
            <this.WebViewComponent
              javaScriptEnabled={true}
              onMessage={this.onMessage}
              ref={this.registerWebView}
              useWebKit={true}
              scalesPageToFit={false}
              source={{ html: this.state.html, baseUrl: RNFS.DocumentDirectoryPath }}
              style={this.webViewStyle}
              allowFileAccess={true}              
            />
          )}
      </View>
    );
  }

  private registerWebView = (webView: WebViewRef) => {
    this.webView = webView;
    if(!!this.props.webviewRef) this.props.webviewRef(webView)
  }

  private async loadResources(): Promise<void> {
    const scriptRequest = this.ResourceProvider.getQuillScript();
    const hightlightJSScriptRequest = this.ResourceProvider.getHightlightJSScript();
    const styleSheetRequest = this.ResourceProvider.getQuillStyleSheet(this.ThemeProvider);
    const highlightJSstyleSheetRequest = this.ResourceProvider.getHighlightJSstyleSheet(this.ThemeProvider);

    const [script, styleSheet, hljs, hljsCSS] = await Promise.all([scriptRequest, styleSheetRequest, hightlightJSScriptRequest, highlightJSstyleSheetRequest]);
    const options = this.props.options || {};
    const blotsScriptString = this.props.modules.blots.join(";"); //将每一个blots代码拼接起来
    const formatsScriptString = this.props.modules.formats.join(";"); //将每一个formats代码拼接起来
    const injectedScript = this.props.injectedJavaScript || '';
    let finalscript = injectedScript + ';' + script + ';' + blotsScriptString + ';' + formatsScriptString; //和主代码字串拼接起来

    // console.log("生成的HTML是：：", generateWebViewIndex({ script, styleSheet }, this.props.content, options));
    this.setState({
      html: generateWebViewIndex({ script: finalscript, styleSheet, editorStyle: this.props.editorStyle, hljs, hljsCSS  }, this.props.content, JSON.stringify(options)),
    });
  }

  private sendMessage = (type: EventType, data?: any) => {
    if (this.webView) {
      this.webView.injectJavaScript(`(function() {
        document.body.style.backgroundColor = "red"; 
        window.postMessage(
          ${JSON.stringify({ type, data })}, '*'
          )})();
      `
      )
      //this.webView.postMessage();
    }
  }

  private processMessage(message: IMessage) {
    const { type, data } = message;

    switch (type) {
      case EventType.CONTENT_CHANGE:
        return this.props.onContentChange && this.props.onContentChange(data);
      default:
        return this.props.onMessage && this.props.onMessage(message);
    }
  }

  private onMessage(event: WebViewMessageEvent) {
    try {
      // TODO: Implement only sending delta's to save time on JSON parsing overhead
      this.processMessage(JSON.parse(event.nativeEvent.data));
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.warn('Ignoring unprocessable event from Quill WebView due to error: ', error);
    }
  }
}
