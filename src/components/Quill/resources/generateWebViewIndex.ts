import { QuillOptionsStatic } from 'quill'
import { DeltaStatic } from 'quill-delta'
import { EventType } from '../interfaces/IMessage'
import { IResources } from '../interfaces/IResources'

/* This file contains HTML for the webview that contains Quill. You can use the es6-string-html, es6-string-css and 
   es6-string-javascript plugins for VSCode to get syntax highlighting on this file.
   
   We input all EventType.{...} occurrences as variables in the template strings to enable type analysis for the event
   types, since they might be change sensitive. */

export function generateWebViewIndex (
  resources: IResources,
  content: DeltaStatic | undefined,
  options: QuillOptionsStatic
) {
  return /*html*/ `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
        <title>Quill Page</title>

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
        <div id="progress">
        <span></span>
        </div>
        <!--<h1 id="scrollPosition">hello</h1>-->
        <button type='file' onClick="onSelectFile()">select</button>
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
          function onSelectFile (files) {
            window.requestFilePicker();
          }
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

          const Toolbar = Quill.import('modules/toolbar');
          class NewToolBar extends Toolbar {
            constructor(quill, options) {
              super(quill, options);
              quill.container.parentNode.removeChild(this.container);
              quill.container.parentNode.parentNode.appendChild(this.container);
            }
          }
          Quill.register('modules/toolbar', NewToolBar, true)
          /* Create the Quill editor */
          const editor = new Quill('.quill-wrapper .quill-editor', ${JSON.stringify(options)});
          /* Set the initial content */
          editor.setContents(${JSON.stringify(content)})

          /* Send a message when the text changes */
          // Focus ===> Size
          editor.on('text-change', function() {
            sendMessage(${
              EventType.CONTENT_CHANGE
            }, {currentDelta: editor.getContents(), fullPlainText: editor.getText(0), currentSelection: editor.getSelection()});
          });
          editor.on('scroll-optimize', function(mutations) {
            console.log("scroll", mutations)
          });
           editor.root.addEventListener('focus', (e) => {
            //onFocus(editor);
            });
          let qlToolbar = document.querySelector('.ql-toolbar');
          editor.root.addEventListener('blur', (e) => {
            console.log("触发blur", e)
            if (qlToolbar.contains(e.relatedTarget)) {
              console.log("停止事件")
               e.preventDefault();
              e.stopImmediatePropagation(); 
              e.stopPropagation(); 
            } else {
              // onBlur(editor);
            }

            }); 
            let last_known_scroll_position = 0;
            let last_known_scroll_top = 0;
            let ticking = false;
            let scrollContainer = editor.scrollingContainer;
            scrollContainer.addEventListener('scroll', (e) => {
            last_known_scroll_position = scrollContainer.scrollHeight;
            if (!ticking) {
            if (scrollContainer.scrollTop > last_known_scroll_top) {
              // 向下
              window.reportScroll('down')
            } else {
              // 向上
              window.reportScroll('up') 
            };
            last_known_scroll_top = scrollContainer.scrollTop;
            window.requestAnimationFrame(function() {
              let scrollAvail = last_known_scroll_position - scrollContainer.clientHeight; // 可滚动的高度
              let ratio = scrollContainer.scrollTop / scrollAvail
              //document.getElementById("scrollPosition").innerHTML = ratio;
              document.getElementById("progress").style.width = ratio * 100 + '%';
            ticking = false;
            });
          }
          ticking = true;
            });
        //键盘弹起后页面高度变小
             const originHeight = document.documentElement.clientHeight || document.body.clientHeight;
             window.addEventListener('resize', (e) => {
               console.log("触发了resize")
              const resizeHeight = document.documentElement.clientHeight || document.body.clientHeight;
              //document.querySelector("body").style.height = resizeHeight - 90 + 'px';
              if (resizeHeight < originHeight) {
                               console.log("小于")
                // 键盘弹起所后所需的页面逻辑
                // TODO 横屏之后也进入到这里来了。横屏之后要更新 originHeight 。
                            //editor.container.classList.add('quill-focus');
                //document.querySelector(".ql-toolbar").style.display = 'block';
                //setTimeout(()=>editor.root.focus(), 100)
                //setTimeout(()=>editor.focus(), 100)
                if (editor.hasFocus()) {
                  editor.focus();
                  onFocus(editor);
                  }
              } else {
                console.log("大于")
                // 键盘弹起所后所需的页面逻辑
                //editor.container.classList.remove('quill-focus');
                //document.querySelector(".ql-toolbar").style.display = 'none';
                //setTimeout(()=>editor.root.blur(), 100)
                //setTimeout(()=>editor.blur(), 100)
                  editor.blur();
                  onBlur(editor);
              };
              editor.selection.scrollIntoView(editor.scrollingContainer);
/*               e.preventDefault();
              e.stopPropagation(); */
            }, false); 
          
              window.fileBlotInsert = (files, overriderange) => {
                // 通过Input选择文件调用的插入
                // 文件路径 e.target.files
                let quill = editor;
                console.log("正在插入文件",files);
                let range;
                if (overriderange) {
                  range = overriderange
                } else {
                  range = quill.selection.savedRange; // cursor position
                }
                if (!range || range.length != 0) return;
                const position = range.index;
                let promises = Array.from(files).map(a => {
                  return new Promise (resolve => {
                    let fileValue =  {
                      lastmodified: a.lastModified ? a.lastModified.toString() : '',
                      name: a.name,
                      path: a.path,
                      size: a.size,
                      type: a.type,
                      randomtag: Math.random() // 将被作为文件名
                      .toString(36)
                      .substr(2),
                      extension: a.name.split('.').pop(),
                      sourceobject: a // 有时需要读取原始file object，例如截图时不会传来文件path。
                    };
                    quill.insertEmbed(position, 'file', fileValue, 'user');
                  resolve(fileValue);
                  })
                });
              Promise.all(promises).then(fileValues => {
                quill.setSelection(
                  position + fileValues.length,
                  'user',
                );
              })
            };
          bindMessageHandler();
          window.onerror = (msg,url,l,c,error) => {
            window.reportError(msg,url,l,c,error)
          }
        </script>
      </body>
    </html>
  `
}
