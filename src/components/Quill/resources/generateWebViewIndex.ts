import { QuillOptionsStatic } from 'quill';
import { DeltaStatic } from 'quill-delta';
import { EventType } from '../interfaces/IMessage';
import { IResources } from '../interfaces/IResources';

/* This file contains HTML for the webview that contains Quill. You can use the es6-string-html, es6-string-css and 
   es6-string-javascript plugins for VSCode to get syntax highlighting on this file.
   
   We input all EventType.{...} occurrences as variables in the template strings to enable type analysis for the event
   types, since they might be change sensitive. */

export function generateWebViewIndex(
  resources: IResources,
  content: DeltaStatic | undefined,
  options: QuillOptionsStatic
) {
  return (/*html*/ `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
        <title>Quill Page</title>
        <style>
          html,
          body {
            height: 100%;
            margin: 0;
            padding: 0;
          }
          .quill-wrapper {
            /* height: calc(100% - 88px); */
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .ql-toolbar {
            display: none;
            order: 1;
          }
          .quill-editor {
            overflow-y: auto;
          }
          .cloudEditor {
            display: none
          }
        </style>

        <style>
          ${resources.styleSheet}
        </style>
        <style>
          ${resources.editorStyle}
      </style>
      <style>
      ${resources.hljsCSS}
      </style>
      </head>
      <body>
        <div class="quill-wrapper">
          <div class="quill-editor"></div>
        </div>
        <div class="cloudEditor">
          <div class="quill-editor"></div>
        </div>
        <script>
        ${resources.hljs};
        </script>
        <script>
          ${resources.script};
        </script>

        <script>
          function sendMessage(type, data) {
            const message = JSON.stringify({ type, data });

            // window.ReactNativeWebView is used by the react-native-community/react-native-webview package
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(message);
            } else {
              window.postMessage(message);
            }
          }

          function onContentChange(data) {
            editor.setContents(data);
          }

          function openCloudEditor(data) {
            let cloudEditorStyle = document.querySelector(".cloudEditor").style
            if (data === true) {
              document.body.style.display = 'flex';
              document.body.style.flexDirection = 'row';
              cloudEditorStyle.display="block";
              cloudEditorStyle.flex = "1"
            } else {
              cloudEditorStyle.display="none"
            }
          }

          function processMessage(message) {
            const { type, data } = message;
            switch (type) {
              case ${EventType.CONTENT_CHANGE}:
                return onContentChange(data);
              case ${EventType.OPEN_CLOUD_EDITOR}:
                return openCloudEditor(data)
            }
          }

          function onMessage(event) {
            console.log("收到Message", event);
            try {
              // TODO: Implement only sending delta's to save time on JSON parsing overhead
              processMessage(event.data);
            } catch (error) {
              console.warn('Ignoring unprocessable event from React Native to Quill WebView due to error: ', error);
            }
          }

          function bindMessageHandler() {
            window.addEventListener('message', onMessage);
          }

          function onFocus(editor) {
            editor.container.classList.add('quill-focus');
            document.querySelector(".ql-toolbar").style.display = 'block';
          }

          function onBlur(editor) {
            editor.container.classList.remove('quill-focus');
            document.querySelector(".ql-toolbar").style.display = 'none';
          }

          /* Create the Quill editor */
          const editor = new Quill('.quill-wrapper .quill-editor', ${JSON.stringify(options)});

          /* Set the initial content */
          editor.setContents(${JSON.stringify(content)})

          /* Send a message when the text changes */
          editor.on('text-change', function() {
            sendMessage(${EventType.CONTENT_CHANGE}, {currentDelta: editor.getContents(), fullPlainText: editor.getText(0), currentSelection: editor.getSelection()});
          });

          editor.root.addEventListener('focus', (e) => {
            onFocus(editor)
            });
          let qlToolbar = document.querySelector('.ql-toolbar');
          editor.root.addEventListener('blur', (e) => {
            if (qlToolbar.contains(e.relatedTarget)) {
              e.preventDefault();
              e.stopImmediatePropagation();
            } else {
              onBlur(editor);
            }
            
            });
        //键盘弹起后页面高度变小
             const originHeight = document.documentElement.clientHeight || document.body.clientHeight;
            window.addEventListener('resize', () => {
              const resizeHeight = document.documentElement.clientHeight || document.body.clientHeight;
              if (resizeHeight < originHeight) {
                // 键盘弹起所后所需的页面逻辑
                editor.root.focus()
              } else {
                // 键盘弹起所后所需的页面逻辑
                editor.root.blur()
              }
            }, false); 
          bindMessageHandler();
        </script>
      </body>
    </html>
  `);
}
