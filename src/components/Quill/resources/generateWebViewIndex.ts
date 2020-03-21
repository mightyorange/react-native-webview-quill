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
  options: string
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
        var Clipboard = Quill.import('modules/clipboard');
        var Delta = Quill.import('delta');
        class PlainClipboard extends Clipboard {
            constructor(quill, options) {
                super(quill, options);
                quill.root.addEventListener('drop', e => {
                    e.preventDefault();
                    let native;
                    if (document.caretRangeFromPoint) {
                      native = document.caretRangeFromPoint(e.clientX, e.clientY);
                    } else if (document.caretPositionFromPoint) {
                      const position = document.caretPositionFromPoint(e.clientX, e.clientY);
                      native = document.createRange();
                      native.setStart(position.offsetNode, position.offset);
                      native.setEnd(position.offsetNode, position.offset);
                    } else {
                      return;
                    }
                    const normalized = quill.selection.normalizeNative(native);
                    const range = quill.selection.normalizedToRange(normalized);
                    window.fileBlotInsert(e.dataTransfer.files,range, quill);
                  });
            }
            onPaste(e) {
                // 从其他地方复制一个文件，然后在本程序粘贴
                debugger;
                if (e.defaultPrevented || !this.quill.isEnabled()) return;
                const html = e.clipboardData.getData('text/html');
                const files = Array.from(e.clipboardData.files || []);

                if (!html && files.length > 0) {
                    let filesArray = files.map(file=>{
                      return new Promise((resolve, reject)=>{
                        let fr = new FileReader();
                        fr.onload=function(){
                          file.dataURL = this.result.split(',')[1];
                          resolve(file)
                        }
                        fr.readAsDataURL(file);
                      })
                    });
                    Promise.all(filesArray).then(files=>window.fileBlotInsert(files, null, this.quill))
                    e.preventDefault();
                    e.stopImmediatePropagation(); 
                    e.stopPropagation(); 
                } else {
                  super.onPaste(e);
                }
              }
        }
        Quill.register('modules/clipboard', PlainClipboard, true);

        function onSelectFile (filetype) {
          window.requestFilePicker(filetype);
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

        function setEnable (data) {
          editor.enable(!data)
        }
        
        function processMessage(message) {
          const { type, data } = message;
          switch (type) {
            case ${EventType.CONTENT_CHANGE}:
              return onContentChange(data);
            case ${EventType.OPEN_CLOUD_EDITOR}:
              return openCloudEditor(data)
            case ${EventType.UPDATE_READONLY}:
              return setEnable(data)
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
      

        window.keyboardShrink = function (newHeight) {
          if (newHeight) document.body.style.height = newHeight;
          editor.container.classList.add('quill-focus');
          document.querySelector(".ql-toolbar").style.display = 'block';
          setTimeout(()=>{editor.selection.scrollIntoView(editor.scrollingContainer)}, 100);
        }
        window.keyboardExpand = function (newHeight) {
          if (newHeight) document.body.style.height = newHeight;
          editor.container.classList.remove('quill-focus');
          document.querySelector(".ql-toolbar").style.display = 'none';
          setTimeout(()=>{editor.selection.scrollIntoView(editor.scrollingContainer)}, 100);
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
        const editor = new Quill('.quill-wrapper .quill-editor', 
        {
          ...{
            theme: 'snow',
            debug: 'info',
            modules: {
              toolbar: {
                handlers: {
                  // handlers object will be merged with default handlers object
                  /* link: function(value) {
                    console.log("thishahaha", value);
                  } */
                  /* "markpen": (value) => {
                    this.quillRef.format('markpen', true);
                  } */
                  image: function () {
                    window.onSelectFile('image')
                  },
                  link: function () {
                    window.onSelectFile('file')
                  }
                },
                container: [
                  ['bold', 'italic', 'underline', 'strike'], // toggled buttons
                  ['blockquote', 'code-block'],
      
                  [{ header: 1 }, { header: 2 }, { header: 3 }], // custom button values
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  // [{ 'script': 'sub'}, { 'script': 'super' }],      //superscript/subscript
                  [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
                  // [{ 'direction': 'rtl' }],                         //text direction
      
                  // [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
                  // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      
                  [{ color: [] }], // dropdown with defaults from theme
                  [{ font: [] }],
                  // [{ 'align': [] }],
      
                  // ['markpen'],
                  ['image', 'link'] // remove formatting button
                ]
              },
              // imageImport: true,
      
              /*     imageResize: {
                displaySize: true
              }, */
              syntax: true,
              /*     focus: {
                focusClass: "focused-blot" // Defaults to .focused-blot.
              } */
              clipboard: {
                matchers: [
                  [1, function (node, delta) {
                    let backgroundImgInCss = getComputedStyle(node).backgroundImage;
                    let dirtyImgSrc = backgroundImgInCss.match(/\\((.*?)\\)/); /* 注意，这里相比桌面端增加了转义符 */
                    if (dirtyImgSrc) {
                      console.log("返回0", node, delta,dirtyImgSrc, !!dirtyImgSrc, !!backgroundImgInCss, typeof backgroundImgInCss );
                      // 如果是一个普通元素，用backgroundImage来展示图片
                      // 要将quill原生处理过的delta，接上这里制作的file blot delta（因为可能会有一些其他内容）
                      // 如果是一个img标签
                      let imgSrc = dirtyImgSrc[1].replace(/('|")/g,'');
                      let fileValue = {
                        randomtag: Math.random() // 将被作为文件名
                        .toString(36)
                        .substr(2),
                        path: imgSrc,
                        type: 'image/*'
                      }
                      let newdelta = new Delta().insert({file:fileValue});
                      return delta.compose(newdelta);
                    } else if (node.nodeName.toLowerCase() == 'img') {
                      // 如果是一个img标签
                      let fileValue = {
                        randomtag: Math.random() // 将被作为文件名
                        .toString(36)
                        .substr(2),
                        path: node.src,
                        type: 'image/*'
                      }
                      let newdelta = new Delta().insert({file:fileValue});
                      return newdelta;
                    } else {
                      // 否则就将原始delta返回出来
                      return delta
                    }
                  }],
                  ['ins', function (node, delta) {diffMarkNodePaste(node, delta)}],
                  ['del', function (node, delta) {diffMarkNodePaste(node, delta)}],
                  ['article', function (node, delta) {fileBlotPaste(node, delta)}]
                ]
              }
            },
            placeholder: 'mttd开始写点什么吧...',
            readOnly: false,
            formats: [
              'header',
              'bold',
              'italic',
              'underline',
              'strike',
              'blockquote',
              'list',
              'bullet',
              'indent',
              'link',
              'image',
              'color',
              'font',
              'code',
              'size',
              'code-block',
              'file',
              'markpen',
              'HorizontalRule'
            ]
          }, ...${options}}
        );

        // 粘贴的处理
        function diffMarkNodePaste (node, delta) {
          if (node.className == "diffMark") {
            let allFileBlotNode = Array.from(node.querySelectorAll('.fileBlot'));
            if (node.childNodes.length === 1 && node.childNodes[0].className == 'fileBlot') {
              // 證明這是一個fileBlot的diffMark
              let a = node.childNodes[0].dataset;
              let fileValue = {
                lastmodified: a.lastmodified,
                name: a.name,
                path: a.path, // 文件来源地址
                size: a.size,
                type: a.type,
                randomtag: a.randomtag,
                extension: a.extension,
                documentpath: a.documentpath // 在app文档目录下的相对地址，应该被存进ops
              };
              let newdelta = new Delta().insert({ file: fileValue });
              return newdelta;
            } else {
              // 證明這是一個文本diffMark
              // 需要去掉diff顔色
              // 需要保證粘貼到的内容是diffMark裏面的内容（因爲diffMark的顔色是寫在diffMark元素上的）
              return delta
            }
          }
        }

        function fileBlotPaste (node, delta) {
          // 处理从其他笔记中拷贝fileBlot
          if (node.className='fileBlot') {
            let a = node.dataset;
            let fileValue = {
              lastmodified: a.lastmodified,
              name: a.name,
              path: path.join(DocumentDirectoryPath, a.documentpath) , // 文件来源地址，要绝对化
              size: a.size,
              type: a.type,
              randomtag: Math.random() // assign一个新的randomtag作为文件名
              .toString(36)
              .substr(2),
              extension: a.extension,
              // documentpath: a.documentpath  在app文档目录下的相对地址，必须删掉！
            };
            let newdelta = new Delta().insert({ file: fileValue });
            return newdelta;
          }
        };
        // 结束



        /* Set the initial content */
        editor.setContents(${JSON.stringify(content)});
      
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
          if (scrollContainer.scrollTop > last_known_scroll_top && scrollContainer.scrollTop > 0) {
            // 向下
            console.log("down", scrollContainer.scrollTop, last_known_scroll_top);
            window.reportScroll('down')
          } else {
            // ios拉到最开始会有弹跳效果，scrollContainer.scrollTop会等于0甚至小于零，所以这种情况一律显示按钮。
            // 向上
            console.log("up", scrollContainer.scrollTop, last_known_scroll_top);
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
                    name: a.name||'',
                    path: a.path,
                    size: a.size||'',
                    type: a.type||'',
                    randomtag: Math.random() // 将被作为文件名
                    .toString(36)
                    .substr(2),
                    extension: a.name ? a.name.split('.').pop() : '',
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
              // 成功插入文件后，缩回键盘，这是因为，如果用户选好文件回来后，webview的editor会自动blur，程序性加上focus似乎也无效。
              window.keyboardExpand("100%");
            })
          };
        bindMessageHandler();
        window.onerror = (msg,url,l,c,error) => {
          window.reportError(msg,url,l,c,error)
        }
        </script>
        <h1>测试中文</h1>
      </body>
    </html>
  `
}
