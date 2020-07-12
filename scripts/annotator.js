
// https://github.com/dvnc/annotator/tree/0.1.0
var Annotation = (function Annotation() {

    var Annotation = {
        annotator: null,
        range: {
            startContainerXPath: null,
            endContainerXPath: null,
            parentContainerXPath: null,
            startOffset: null,
            endOffset: null
        },
        id: null,
        selectedText: null,
        color: null,

        init: function(obj) {
            if(!obj) return;


            if(obj.annotator) {
                this.annotator = obj.annotator;
            }

            if(obj.selectedRange) {
                this.saveSelection(obj.selectedRange);
            } else if(obj.savedAnnotation) {
                var savedAnnotation = obj.savedAnnotation;

                this.range          = savedAnnotation.range;
                this.id             = savedAnnotation.id;
                this.selectedText   = savedAnnotation.selectedText;
                this.color          = savedAnnotation.color;
            }

            this.setRangeElements();

        },

        setRangeElements: function() {

            this.$parentContainer = $(this.annotator.containerElement);
            this.$startContainer = $(this.annotator.containerElement);
            this.$endContainer = $(this.annotator.containerElement);

        },

        render: function(opts) {
            if(opts && opts.temporary) {
                this.wrapNodes(true);
            } else {
                this.wrapNodes();
            }

            // remove existing selection
            // we don't need it anymore
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            } else if (document.selection) {
                document.selection.empty();
            }
        },

        updateAnnotation: function() {
            var $parentContainer = this.$parentContainer;
 
            var renderedAnnotation = $parentContainer
                                        .find(".annotation[data-id='" + this.id + "']");

            renderedAnnotation.removeClass("annotation");

            renderedAnnotation
                .removeAttr("class")
                .addClass("annotation")
                .addClass(this.color)
                .removeAttr("style");
        },

        saveSelection: function(range) {
            var parentContainer = range.commonAncestorContainer;
            var startContainer = range.startContainer;
            var endContainer = range.endContainer;

            var startOffset = range.startOffset;
            var endOffset = range.endOffset;

            var parentNode = this.getParentNodeFor(parentContainer);
            var startNode = this.getParentNodeFor(startContainer);
            var endNode = this.getParentNodeFor(endContainer);

            var nodesBetweenStart = this.getNodesToWrap(parentNode, startNode.firstChild, startContainer);
            var nodesBetweenEnd = this.getNodesToWrap(parentNode, endNode.firstChild, endContainer);

            if(nodesBetweenStart.length) {
                for(var i = 0; i < nodesBetweenStart.length; i++) {
                    var characterLength = nodesBetweenStart[i].nodeValue.length;
                    startOffset += characterLength;
                }
            }

            if(nodesBetweenEnd.length) {
                for(var i = 0; i < nodesBetweenEnd.length; i++) {
                    endOffset += nodesBetweenEnd[i].nodeValue.length;
                }
            }

            var selectedContent = this.getSelectionContent(range);

            this.range = {
                startContainerXPath: this.annotator.createXPathFromElement(startNode),
                endContainerXPath: this.annotator.createXPathFromElement(endNode),
                parentContainerXPath: this.annotator.createXPathFromElement(parentNode),
                startOffset: startOffset,
                endOffset: endOffset,
            };

            this.id = this.generateRandomID();
            this.selectedText = selectedContent;
        },

        getSelectionContent: function(range) {
            var container = document.createElement("div");
            container.appendChild(range.cloneContents());
            var text = container.textContent;
            return text;
        },

        getParentNodeFor: function(node) {

            while(node.nodeType != 1 || (node.nodeType == 1 && node.classList.contains("js-no-select")) ) {
                node = node.parentNode;
            }

            return node;
        },

        generateRandomID: function() {
            // 加上时间，加上 1~ 10000 的随机数
            return 'annotation-' + new Date().getTime() + Math.floor(Math.random() * 10000) + 1;
        },

        save: function(obj) {

            if(!obj) return;

            this.color = obj.color;

            if(obj.note)
                this.note = obj.note;

            if(obj.tags && obj.tags.length) {
                this.tags = obj.tags
            }

            var data = this.serialize();
            this.postToRemote(data);

            if(obj && obj.cbk) obj.cbk(this);

        },

        // TODO
        destroy: function(cbk) {

            console.log('destroy:' + this.id);

            if(cbk) cbk();
        },

        // TODO
        postToRemote: function(data) {

            console.log(data);
        },

        serialize: function() {
            var range = this.range;
            return {
                id:  this.id,
                selectedText: this.selectedText,
                color: this.color,
            }
        },

        // getContainedNodes: function() {
        //     var range, startContainer, endContainer, parentContainer;
        //     var nodes = [];

        //     range = this.range;
            
        //     parentContainer = this.$parentContainer.get(0);
        //     startContainer = this.$startContainer.get(0);
        //     endContainer = this.$endContainer.get(0);

        //     var startTextNodeParams = this.getTextNodeAtOffset(startContainer, range.startOffset);
        //         endTextNodeParams = this.getTextNodeAtOffset(endContainer, range.endOffset);

        //     var startTextNode = startTextNodeParams[0],
        //         startOffset = startTextNodeParams[1],
        //         endTextNode = endTextNodeParams[0],
        //         endOffset = endTextNodeParams[1];


        //     if (typeof startTextNode !== "undefined" && typeof endTextNode !== "undefined") {
        //         if(startTextNode == endTextNode) {
        //             var startTextNodeSplit = startTextNode.splitText(startOffset);
        //             var endTextNodeSplit = startTextNodeSplit.splitText(endOffset - startOffset);    
        //         } else {
        //             var startTextNodeSplit = startTextNode.splitText(startOffset);
        //             var endTextNodeSplit = endTextNode.splitText(endOffset);    
        //         }


        //         var innerNodes = this.getNodesToWrap(parentContainer, startTextNodeSplit, endTextNodeSplit);


        //         for(var i = 0; i < innerNodes.length; i++) {
        //             nodes.push(innerNodes[i]);
        //         }
        //     }
        //     return nodes;
        // },


        getTextNodeAtOffset: function(rootNode, offset) {
            var textNode,
            count = 0,
            found = false;


            function getTextNodes(node) {
                if (node.nodeType == Node.TEXT_NODE && !/^\s*$/.test(node.nodeValue)) {
                    if ( found != true) {
                        if(count+node.nodeValue.length >= offset) {
                            textNode = node;
                            found = true;    
                        } else {
                            count += node.nodeValue.length
                        }
                    }
                } else if (node.nodeType == Node.ELEMENT_NODE ) {
                    for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                        getTextNodes(node.childNodes[i]);
                    }
                }
            }

            getTextNodes(rootNode);
            return [textNode, (count == 0 ? offset : offset - count)];

        },

        getNodesToWrap: function(rootNode, startNode, endNode) {
            var pastStartNode = false, reachedEndNode = false, textNodes = [];

            function getTextNodes(node) {

                if (node == startNode) {
                    pastStartNode = true;
                } 
                if (node == endNode) {
                    reachedEndNode = true;
                } else if (node.nodeType == Node.TEXT_NODE) {
                    if (pastStartNode && !reachedEndNode && !/^\s*$/.test(node.nodeValue)) {
                        textNodes.push(node);
                    }
                } else if (node.nodeType == Node.ELEMENT_NODE ) {
                    
                    for (var i = 0, len = node.childNodes.length; !reachedEndNode && i < len; ++i) {
                        getTextNodes(node.childNodes[i]);
                    }
                }
            }

            getTextNodes(rootNode);
            return textNodes;
        },


        wrapNodes: function(temporary) {
            // var nodes = this.getContainedNodes();
            // var newNode = this.createWrapperElement(temporary)
            // for(var i = 0; i < nodes.length; i++) {
            //     $(nodes[i]).wrap(newNode);
            //     console.log(newNode);
            // }

            // 使用 mark.js 来渲染
            var annotationID = this.id;
            var className = "annotation " + this.color;
            if (temporary) {
                className = " " + " temporary";
            }
            var content = $(this.annotator.containerElement)
            var self = this;

            content.mark(this.selectedText, {
                acrossElements: true,
                element: "span",
                className: className, 
            separateWordSearch: false,
            // ignoreJoiners: true,
                done: function(counter) {
                    // $results = $content.find("mark");
                    // console.log('counter:' + counter);
                },
                filter: function(textNode, foundTerm, totalCounter, counter){
                    // textNode is the text node which contains the found term
                    // foundTerm is the found search term
                    // totalCounter is a counter indicating the total number of all marks
                    //              at the time of the function call
                    // counter is a counter indicating the number of marks for the found term

                    // textNode.setAttribute("data-index", annotationID);
                    // textNode.setAttribute("data-index", annotationID);

                    // console.log('-----');
                    // console.log(textNode);
                    // console.log("\n"+foundTerm+"\n"+totalCounter+"\n"+counter);
                    // console.log('-----');

                    // 如果位置不一致的话
                    // if(counter != this.nth){
                    //     return false;
                    // }
                    
                    return true; // must return either true or false
                },
                noMatch: function(term){
                    // term is the not found term
                    console.log('noMatch:' + self.selectedText);
                },
                each: function(node){
                    // node is the marked DOM element
                    node.setAttribute("data-id", annotationID);
                },
            });
        },

        createWrapperElement: function(temporary) {

            var span = document.createElement("span");

            if(!temporary) {
                span.classList.add("annotation");
                span.classList.add(this.color);
            } else {
                span.classList.add("temporary");
            }

            span.setAttribute("data-id", annotationID);

            return span;
        },

        removeTemporary: function() {
            var temporary = this.$parentContainer.find(".temporary");

            for(var i = 0; i < temporary.length; i++) {
                var elem = temporary[i];
                $(elem.childNodes[0]).unwrap();
            }
        },

        convertFromTemporary: function() {
            var temporary = this.$parentContainer.find(".temporary");

            temporary
            .removeClass("temporary")
            .addClass("annotation")
            .addClass(this.color);

        }


    };

    return Annotation;
})();
var Editor = (function Editor() {
    var Editor = {
        annotator: null,
        annotation: null,
        events: [

            {
                selector: ".js-color-picker",
                event: "click",
                action: "setColor"
            },

            {
                selector: ".js-copy",
                event: "click",
                action: "copyToClipboard"
            },

            {
                selector: ".js-remove-annotation",
                event: "click",
                action: "removeAnnotation"
            }
        ],

        init: function(opts) {
            this.annotator = opts.annotator;
            var $containerElement = $("body");
            this.$popoverElement = $(this.renderEditorTemplate());

            $containerElement.append(this.$popoverElement);

            this.events.forEach(function(eventMap) {
                var editor = this;
                this.$popoverElement.on(eventMap["event"], eventMap["selector"], function(e) {
                    e.preventDefault();
                    editor[eventMap["action"]].call(editor, e);
                })
            }, this);
        },

        renderEditorTemplate: function() {
            var html =  '<div id="annotation-editor">'
                     +      '<ul class="dropdown-list">'
                     +          '<li class="colors">';

                this.annotator.colors.forEach(function(color, index) {
                    var className = 'js-color-picker color'
                                  + ' ' + color.className 
                                  + ' ' + (index == 0 ? 'active' : '')
                        ;
                    html += '<span data-color="' + color.className + '" class="' + className + '"></span>';
                });

            html += '</li><li class="errors"></li>'
                 +  '<li><a href="#" class="js-copy">复制</a></li>'
                 +   '<li class="js-remove-annotation-wrapper"><a href="#" class="js-remove-annotation">移除高亮</a></li>'
                 +   '</ul>'
                 + '</div>'
            ;

            return html;
        },

        showEditor: function(opts) {
            var $popover = this.$popoverElement;

            var position = opts.position,
            annotation = opts.annotation,
            temporary = opts.temporary;

            var top = position.top - 30;
            var left = position.left - this.$popoverElement.width()/2;

            this.annotation = annotation;
            this.activateAnnotationColor();
            this.renderContents();

            if(!temporary) {
                this.showRemoveBtn();
            }


            if(temporary) {
                this.annotation.render({ temporary: true });
            }

            if(this._awesomplete) {
                this._awesomplete.list = this.annotator.tags;
            }

            $popover.removeClass("anim").css("top", top).css("left", left).show();
            $popover.find("#annotation-input").focus();
        },

        isVisible: function() {
            return this.$popoverElement.is(":visible");
        },

        reset: function() {
            this.annotation.removeTemporary();
            this.resetNoteForm();
            this.hideRemoveBtn();
            this.annotation = null;
            this.$popoverElement.removeAttr("style");
        },

        resetNoteForm: function() {
            this.$popoverElement.find(".js-note-field, .js-tags-field").val("");
        },

        activateAnnotationColor: function() {
            this.$popoverElement
                .find(".js-color-picker.active").removeClass("active");
            this.$popoverElement
                .find(".js-color-picker." + (this.annotation.color || 'yellow'))
                .addClass("active");
        },

        renderContents: function() {
            this.$popoverElement.find(".js-note-field").val(this.annotation.note);

            if(this.annotation.tags)
                this.$popoverElement.find(".js-tags-field").val(this.annotation.tags.join(", "));
        },

        showRemoveBtn: function() {
            this.$popoverElement.find(".js-remove-annotation-wrapper").show();
        },

        hideRemoveBtn: function() {
            this.$popoverElement.find(".js-remove-annotation-wrapper").hide();
        },

        hideEditor: function(event) {
            this.reset();
            this.$popoverElement.hide();
        },

        setColor: function(e) {
            var $target = $(e.target);
            var color = $target.data("color");
            var $form = this.$popoverElement.find(".js-note-form");

            var note = $form.find(".js-note-field").val();

            this.saveAndClose({ color: color, note: note, tags: {} });
        },

        saveAndClose: function(data) {
            if(!data) return;

            var params = {
                debug: this.annotator.debug,
                cbk: function(annotation) {
                    if(!this.annotator.findAnnotation(annotation.id)) {
                        this.annotation.render({ convert: true });
                        this.annotator.annotations.push(annotation);
                    } else {
                        this.annotator.updateAnnotation(annotation.id, annotation);
                        this.annotation.render({ update: true });
                    }

                    // save tags to global list
                    this.annotator.addTags(annotation.tags);

                    if(this.annotator.debug)
                        this.saveToLocalStorage();

                    this.hideEditor();
                }.bind(this)
            }

            $.extend(params, data);
            void 0;
            this.annotation.save(params);
        },

        copyToClipboard: function() {
            var text = this.annotation.selectedText;

            var textarea = $("<textarea class='js-hidden-textarea'></textarea>");
            $(this.annotator.containerElement).append(textarea);
            textarea.val(text).select();

            try {
                document.execCommand("copy");
            } catch(e) {
                void 0;
            }

            this.hideEditor();
            textarea.remove();
        },

        truncate: function(str, limit) {

            if(str.length <= limit) return str;

            while(str.length >= limit) {
                str = str.substr(0, str.lastIndexOf(" "));
            }

            return str + "...";
        },

        removeAnnotation: function() {
            var annotation = this.annotation;
            var annotator = this.annotator;


            if(!annotation) return;

            var renderedAnnotation = $(this.annotator.containerElement)
                                        .find(".annotation[data-id='" + annotation.id + "']");

            this.annotation.destroy(function() {
                annotator.removeAnnotation(annotation.id);
                renderedAnnotation.contents().unwrap();
            });

            if(this.annotator.debug)
                this.saveToLocalStorage();
            this.hideEditor();
        },

        saveToLocalStorage: function() {
            // save to localStorage
            if(window.localStorage) {
                var serializedAnnotations = this.annotator.annotations.map(function(annotation) {
                    return annotation.serialize();
                });

                window.localStorage.setItem("annotations", JSON.stringify(serializedAnnotations));
            }
        }


    }


    return Editor;
})();
var Annotator = (function Annotator() {

    var Annotator = {
        containerElement: "body",
        annotations: [],
        editor: null,

        defaultColor: "yellow",
        colors: [
            {
                className: "yellow",
            },

            {
                className: "green",
            },

            {
                className: "pink",
            },

            {
                className: "blue",
            },
        ],

        tags: [],


        init: function(opts) {
            this.containerElement = opts.containerElement || "body";
            this.debug = opts.debug || "true";
            this.remoteURL = opts.remoteURL || "";

            if(opts.existingTags) {
                this.tags = opts.existingTags;
            }

            if(opts.colors) {
                this.colors = opts.colors;
            }

            if(opts.annotations) {
                this.renderExistingAnnotations(opts.annotations);
            }

            // Setup editor
            var editor = Object.create(Editor);
            editor.init({ annotator: this });
            this.setEditor(editor);
        },

        addTags: function(tags) {
            this.tags = this.tags.concat(tags);
        },

        setEditor: function(editor) {
            this.editor = editor;
        },

        findAnnotation: function(annotationID) {
            return this.annotations.filter(function(annotation) {
                return annotation.id == annotationID;
            })[0];
        },

        updateAnnotation: function(annotationID, newAnnotation) {
            var index = this.annotations.map(function(i) { return i.id }).indexOf(annotationID);
            if(index <= -1) return;
            this.annotations[index] = newAnnotation;
        },

        removeAnnotation: function(annotationID) {
            var index = this.annotations.map(function(i) { return i.id }).indexOf(annotationID);
            if(index <= -1) return;

            this.annotations.splice(index, 1);
        },

        renderExistingAnnotations: function(annotations) {
            for(var i = 0; i < annotations.length; i++) {
                var annotation = Object.create(Annotation);
                annotation.init({ savedAnnotation: annotations[i], annotator: this });
                annotation.render();
                this.annotations.push(annotation);
            }
        },


        handleAnnotationClick: function(e) {
            var $target = $(e.target);
            var annotationID = $target.data("id");
            var annotation = this.findAnnotation(annotationID);

            if(!annotation) return;

            this.editor.showEditor({
                position:  {
                    top: e.pageY,
                    left: e.pageX
                },
                annotation: annotation
            });

        },

        handleAnnotation: function(e) {
            var selection = window.getSelection();

            var selectedText;
            if(selection.text) {
                selectedText = selection.text;
            } else {
                selectedText = selection.toString();
            };


            if(selection && !selection.isCollapsed && selectedText && selectedText.length>3) {
                var range = selection.getRangeAt(0);

                var annotation = Object.create(Annotation);

                if (selectedText.length>500) {
                    $('#annotation-editor .errors').text('⚠️ 选中字数过长');
                    $('#annotation-editor .errors').show();
                    $('#annotation-editor .colors').hide();
                }
                
                annotation.init({ selectedRange: range, annotator: this });

                var position = {
                    top: e.pageY,
                    left: e.pageX
                };


                this.editor.showEditor({
                    temporary: true,
                    position: {
                        top: e.pageY,
                        left: e.pageX
                    },
                    annotation: annotation
                });
            }
        },

        startListening: function() {
            var $element = $(this.containerElement);
            var self = this;

            $element.on("mouseup touchend", function(e) {
                var $target = $(e.target);

                e.preventDefault();
                e.stopPropagation();

                if(
                    self.editor.isVisible() 
                    && !$target.parents("#annotation-editor").length 
                    && !$target.hasClass("annotation")
                    && self.editor.annotation != null
                ) {
                    // editor is open but clicked outside
                    self.editor.hideEditor()
                }

                // 过滤器，以下这些情况就不支持选中
                $('#annotation-editor .errors').hide();
                $('#annotation-editor .colors').show();
                if (
                    $target.parents("pre").length > 0  // 代码块不支持
                    || $target.find(".token").length > 0 // 同上
                    || $target.find("pre").length > 0 // 同上
                ) {
                    $('#annotation-editor .errors').text('⚠️ 不支持选中代码块');
                    $('#annotation-editor .errors').show();
                    $('#annotation-editor .colors').hide();
                } else if ($target.find(".img").length > 0) {
                    $('#annotation-editor .errors').text('⚠️ 不支持图片标记，请勿选中图片');
                    $('#annotation-editor .errors').show();
                    $('#annotation-editor .colors').hide();
                }

   
                if(!$target.parents(".js-no-select").length) {
                    self.handleAnnotation(e);
                }
            });

            $element.on("click", ".annotation", function(e) {
                e.stopPropagation();
                self.handleAnnotationClick(e);
            });

        },

        findElementByXPath: function(path) {
            var evaluator = new XPathEvaluator(); 
            path = '//' + path;
            var result = evaluator.evaluate(path, document.querySelector('body'), null, XPathResult.ANY_UNORDERED_NODE_TYPE, null); 
            return  result.singleNodeValue; 
        },

        createXPathFromElement: function(elm) {
            var allNodes = document.getElementsByTagName('*'); 

            for (var segs = []; elm && elm.nodeType == 1 && elm != document.querySelector(this.containerElement).parentNode; elm = elm.parentNode) { 
                if (elm.hasAttribute('id')) { 
                    var uniqueIdCount = 0; 
                    for (var n=0;n < allNodes.length;n++) { 
                        if (allNodes[n].hasAttribute('id') && allNodes[n].id == elm.id) uniqueIdCount++; 
                        if (uniqueIdCount > 1) break; 
                    }; 

                    if ( uniqueIdCount == 1) { 
                        segs.unshift('id("' + elm.getAttribute('id') + '")'); 
                        return segs.join('/'); 
                    } else { 
                        segs.unshift(elm.localName.toLowerCase() + '[@id="' + elm.getAttribute('id') + '"]'); 
                    } 

                } else if (elm.hasAttribute('class')) { 
                    segs.unshift(elm.localName.toLowerCase() + '[@class="' + elm.getAttribute('class') + '"]'); 
                } else { 
                    for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) { 
                        if (sib.localName == elm.localName)  i++; 
                    }; 
                    segs.unshift(elm.localName.toLowerCase() + '[' + i + ']'); 
                }; 
            } 

            return segs.length ? '' + segs.join('/') : null; 
        }

    };

    return Annotator;
})();