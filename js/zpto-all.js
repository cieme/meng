/* Zepto v1.0-1-ga3cab6c - polyfill zepto detect event ajax form fx - zeptojs.com/license */


;(function(undefined){
    if (String.prototype.trim === undefined) // fix for iOS 3.2
      String.prototype.trim = function(){ return this.replace(/^\s+|\s+$/g, '') }
  
    // For iOS 3.x
    // from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
    if (Array.prototype.reduce === undefined)
      Array.prototype.reduce = function(fun){
        if(this === void 0 || this === null) throw new TypeError()
        var t = Object(this), len = t.length >>> 0, k = 0, accumulator
        if(typeof fun != 'function') throw new TypeError()
        if(len == 0 && arguments.length == 1) throw new TypeError()
  
        if(arguments.length >= 2)
         accumulator = arguments[1]
        else
          do{
            if(k in t){
              accumulator = t[k++]
              break
            }
            if(++k >= len) throw new TypeError()
          } while (true)
  
        while (k < len){
          if(k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t)
          k++
        }
        return accumulator
      }
  
  })()
  
  var Zepto = (function() {
    var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter,
      document = window.document,
      elementDisplay = {}, classCache = {},
      getComputedStyle = document.defaultView.getComputedStyle,
      cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
      fragmentRE = /^\s*<(\w+|!)[^>]*>/,
      tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
      rootNodeRE = /^(?:body|html)$/i,
  
      // special attributes that should be get/set via method calls
      methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
  
      adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
      table = document.createElement('table'),
      tableRow = document.createElement('tr'),
      containers = {
        'tr': document.createElement('tbody'),
        'tbody': table, 'thead': table, 'tfoot': table,
        'td': tableRow, 'th': tableRow,
        '*': document.createElement('div')
      },
      readyRE = /complete|loaded|interactive/,
      classSelectorRE = /^\.([\w-]+)$/,
      idSelectorRE = /^#([\w-]*)$/,
      tagSelectorRE = /^[\w-]+$/,
      class2type = {},
      toString = class2type.toString,
      zepto = {},
      camelize, uniq,
      tempParent = document.createElement('div')
  
    zepto.matches = function(element, selector) {
      if (!element || element.nodeType !== 1) return false
      var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                            element.oMatchesSelector || element.matchesSelector
      if (matchesSelector) return matchesSelector.call(element, selector)
      // fall back to performing a selector:
      var match, parent = element.parentNode, temp = !parent
      if (temp) (parent = tempParent).appendChild(element)
      match = ~zepto.qsa(parent, selector).indexOf(element)
      temp && tempParent.removeChild(element)
      return match
    }
  
    function type(obj) {
      return obj == null ? String(obj) :
        class2type[toString.call(obj)] || "object"
    }
  
    function isFunction(value) { return type(value) == "function" }
    function isWindow(obj)     { return obj != null && obj == obj.window }
    function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
    function isObject(obj)     { return type(obj) == "object" }
    function isPlainObject(obj) {
      return isObject(obj) && !isWindow(obj) && obj.__proto__ == Object.prototype
    }
    function isArray(value) { return value instanceof Array }
    function likeArray(obj) { return typeof obj.length == 'number' }
  
    function compact(array) { return filter.call(array, function(item){ return item != null }) }
    function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
    camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
    function dasherize(str) {
      return str.replace(/::/g, '/')
             .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
             .replace(/([a-z\d])([A-Z])/g, '$1_$2')
             .replace(/_/g, '-')
             .toLowerCase()
    }
    uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }
  
    function classRE(name) {
      return name in classCache ?
        classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
    }
  
    function maybeAddPx(name, value) {
      return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
    }
  
    function defaultDisplay(nodeName) {
      var element, display
      if (!elementDisplay[nodeName]) {
        element = document.createElement(nodeName)
        document.body.appendChild(element)
        display = getComputedStyle(element, '').getPropertyValue("display")
        element.parentNode.removeChild(element)
        display == "none" && (display = "block")
        elementDisplay[nodeName] = display
      }
      return elementDisplay[nodeName]
    }
  
    function children(element) {
      return 'children' in element ?
        slice.call(element.children) :
        $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
    }
  
    // `$.zepto.fragment` takes a html string and an optional tag name
    // to generate DOM nodes nodes from the given html string.
    // The generated DOM nodes are returned as an array.
    // This function can be overriden in plugins for example to make
    // it compatible with browsers that don't support the DOM fully.
    zepto.fragment = function(html, name, properties) {
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
      if (!(name in containers)) name = '*'
  
      var nodes, dom, container = containers[name]
      container.innerHTML = '' + html
      dom = $.each(slice.call(container.childNodes), function(){
        container.removeChild(this)
      })
      if (isPlainObject(properties)) {
        nodes = $(dom)
        $.each(properties, function(key, value) {
          if (methodAttributes.indexOf(key) > -1) nodes[key](value)
          else nodes.attr(key, value)
        })
      }
      return dom
    }
  
    // `$.zepto.Z` swaps out the prototype of the given `dom` array
    // of nodes with `$.fn` and thus supplying all the Zepto functions
    // to the array. Note that `__proto__` is not supported on Internet
    // Explorer. This method can be overriden in plugins.
    zepto.Z = function(dom, selector) {
      dom = dom || []
      dom.__proto__ = $.fn
      dom.selector = selector || ''
      return dom
    }
  
    // `$.zepto.isZ` should return `true` if the given object is a Zepto
    // collection. This method can be overriden in plugins.
    zepto.isZ = function(object) {
      return object instanceof zepto.Z
    }
  
    // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
    // takes a CSS selector and an optional context (and handles various
    // special cases).
    // This method can be overriden in plugins.
    zepto.init = function(selector, context) {
      // If nothing given, return an empty Zepto collection
      if (!selector) return zepto.Z()
      // If a function is given, call it when the DOM is ready
      else if (isFunction(selector)) return $(document).ready(selector)
      // If a Zepto collection is given, juts return it
      else if (zepto.isZ(selector)) return selector
      else {
        var dom
        // normalize array if an array of nodes is given
        if (isArray(selector)) dom = compact(selector)
        // Wrap DOM nodes. If a plain object is given, duplicate it.
        else if (isObject(selector))
          dom = [isPlainObject(selector) ? $.extend({}, selector) : selector], selector = null
        // If it's a html fragment, create nodes from it
        else if (fragmentRE.test(selector))
          dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
        // If there's a context, create a collection on that context first, and select
        // nodes from there
        else if (context !== undefined) return $(context).find(selector)
        // And last but no least, if it's a CSS selector, use it to select nodes.
        else dom = zepto.qsa(document, selector)
        // create a new Zepto collection from the nodes found
        return zepto.Z(dom, selector)
      }
    }
  
    // `$` will be the base `Zepto` object. When calling this
    // function just call `$.zepto.init, which makes the implementation
    // details of selecting nodes and creating Zepto collections
    // patchable in plugins.
    $ = function(selector, context){
      return zepto.init(selector, context)
    }
  
    function extend(target, source, deep) {
      for (key in source)
        if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
          if (isPlainObject(source[key]) && !isPlainObject(target[key]))
            target[key] = {}
          if (isArray(source[key]) && !isArray(target[key]))
            target[key] = []
          extend(target[key], source[key], deep)
        }
        else if (source[key] !== undefined) target[key] = source[key]
    }
  
    // Copy all but undefined properties from one or more
    // objects to the `target` object.
    $.extend = function(target){
      var deep, args = slice.call(arguments, 1)
      if (typeof target == 'boolean') {
        deep = target
        target = args.shift()
      }
      args.forEach(function(arg){ extend(target, arg, deep) })
      return target
    }
  
    // `$.zepto.qsa` is Zepto's CSS selector implementation which
    // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
    // This method can be overriden in plugins.
    zepto.qsa = function(element, selector){
      var found
      return (isDocument(element) && idSelectorRE.test(selector)) ?
        ( (found = element.getElementById(RegExp.$1)) ? [found] : [] ) :
        (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
        slice.call(
          classSelectorRE.test(selector) ? element.getElementsByClassName(RegExp.$1) :
          tagSelectorRE.test(selector) ? element.getElementsByTagName(selector) :
          element.querySelectorAll(selector)
        )
    }
  
    function filtered(nodes, selector) {
      return selector === undefined ? $(nodes) : $(nodes).filter(selector)
    }
  
    $.contains = function(parent, node) {
      return parent !== node && parent.contains(node)
    }
  
    function funcArg(context, arg, idx, payload) {
      return isFunction(arg) ? arg.call(context, idx, payload) : arg
    }
  
    function setAttribute(node, name, value) {
      value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
    }
  
    // access className property while respecting SVGAnimatedString
    function className(node, value){
      var klass = node.className,
          svg   = klass && klass.baseVal !== undefined
  
      if (value === undefined) return svg ? klass.baseVal : klass
      svg ? (klass.baseVal = value) : (node.className = value)
    }
  
    // "true"  => true
    // "false" => false
    // "null"  => null
    // "42"    => 42
    // "42.5"  => 42.5
    // JSON    => parse if valid
    // String  => self
    function deserializeValue(value) {
      var num
      try {
        return value ?
          value == "true" ||
          ( value == "false" ? false :
            value == "null" ? null :
            !isNaN(num = Number(value)) ? num :
            /^[\[\{]/.test(value) ? $.parseJSON(value) :
            value )
          : value
      } catch(e) {
        return value
      }
    }
  
    $.type = type
    $.isFunction = isFunction
    $.isWindow = isWindow
    $.isArray = isArray
    $.isPlainObject = isPlainObject
  
    $.isEmptyObject = function(obj) {
      var name
      for (name in obj) return false
      return true
    }
  
    $.inArray = function(elem, array, i){
      return emptyArray.indexOf.call(array, elem, i)
    }
  
    $.camelCase = camelize
    $.trim = function(str) { return str.trim() }
  
    // plugin compatibility
    $.uuid = 0
    $.support = { }
    $.expr = { }
  
    $.map = function(elements, callback){
      var value, values = [], i, key
      if (likeArray(elements))
        for (i = 0; i < elements.length; i++) {
          value = callback(elements[i], i)
          if (value != null) values.push(value)
        }
      else
        for (key in elements) {
          value = callback(elements[key], key)
          if (value != null) values.push(value)
        }
      return flatten(values)
    }
  
    $.each = function(elements, callback){
      var i, key
      if (likeArray(elements)) {
        for (i = 0; i < elements.length; i++)
          if (callback.call(elements[i], i, elements[i]) === false) return elements
      } else {
        for (key in elements)
          if (callback.call(elements[key], key, elements[key]) === false) return elements
      }
  
      return elements
    }
  
    $.grep = function(elements, callback){
      return filter.call(elements, callback)
    }
  
    if (window.JSON) $.parseJSON = JSON.parse
  
    // Populate the class2type map
    $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
      class2type[ "[object " + name + "]" ] = name.toLowerCase()
    })
  
    // Define methods that will be available on all
    // Zepto collections
    $.fn = {
      // Because a collection acts like an array
      // copy over these useful array functions.
      forEach: emptyArray.forEach,
      reduce: emptyArray.reduce,
      push: emptyArray.push,
      sort: emptyArray.sort,
      indexOf: emptyArray.indexOf,
      concat: emptyArray.concat,
  
      // `map` and `slice` in the jQuery API work differently
      // from their array counterparts
      map: function(fn){
        return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
      },
      slice: function(){
        return $(slice.apply(this, arguments))
      },
  
      ready: function(callback){
        if (readyRE.test(document.readyState)) callback($)
        else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
        return this
      },
      get: function(idx){
        return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
      },
      toArray: function(){ return this.get() },
      size: function(){
        return this.length
      },
      remove: function(){
        return this.each(function(){
          if (this.parentNode != null)
            this.parentNode.removeChild(this)
        })
      },
      each: function(callback){
        emptyArray.every.call(this, function(el, idx){
          return callback.call(el, idx, el) !== false
        })
        return this
      },
      filter: function(selector){
        if (isFunction(selector)) return this.not(this.not(selector))
        return $(filter.call(this, function(element){
          return zepto.matches(element, selector)
        }))
      },
      add: function(selector,context){
        return $(uniq(this.concat($(selector,context))))
      },
      is: function(selector){
        return this.length > 0 && zepto.matches(this[0], selector)
      },
      not: function(selector){
        var nodes=[]
        if (isFunction(selector) && selector.call !== undefined)
          this.each(function(idx){
            if (!selector.call(this,idx)) nodes.push(this)
          })
        else {
          var excludes = typeof selector == 'string' ? this.filter(selector) :
            (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
          this.forEach(function(el){
            if (excludes.indexOf(el) < 0) nodes.push(el)
          })
        }
        return $(nodes)
      },
      has: function(selector){
        return this.filter(function(){
          return isObject(selector) ?
            $.contains(this, selector) :
            $(this).find(selector).size()
        })
      },
      eq: function(idx){
        return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
      },
      first: function(){
        var el = this[0]
        return el && !isObject(el) ? el : $(el)
      },
      last: function(){
        var el = this[this.length - 1]
        return el && !isObject(el) ? el : $(el)
      },
      find: function(selector){
        var result, $this = this
        if (typeof selector == 'object')
          result = $(selector).filter(function(){
            var node = this
            return emptyArray.some.call($this, function(parent){
              return $.contains(parent, node)
            })
          })
        else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
        else result = this.map(function(){ return zepto.qsa(this, selector) })
        return result
      },
      closest: function(selector, context){
        var node = this[0], collection = false
        if (typeof selector == 'object') collection = $(selector)
        while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
          node = node !== context && !isDocument(node) && node.parentNode
        return $(node)
      },
      parents: function(selector){
        var ancestors = [], nodes = this
        while (nodes.length > 0)
          nodes = $.map(nodes, function(node){
            if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
              ancestors.push(node)
              return node
            }
          })
        return filtered(ancestors, selector)
      },
      parent: function(selector){
        return filtered(uniq(this.pluck('parentNode')), selector)
      },
      children: function(selector){
        return filtered(this.map(function(){ return children(this) }), selector)
      },
      contents: function() {
        return this.map(function() { return slice.call(this.childNodes) })
      },
      siblings: function(selector){
        return filtered(this.map(function(i, el){
          return filter.call(children(el.parentNode), function(child){ return child!==el })
        }), selector)
      },
      empty: function(){
        return this.each(function(){ this.innerHTML = '' })
      },
      // `pluck` is borrowed from Prototype.js
      pluck: function(property){
        return $.map(this, function(el){ return el[property] })
      },
      show: function(){
        return this.each(function(){
          this.style.display == "none" && (this.style.display = null)
          if (getComputedStyle(this, '').getPropertyValue("display") == "none")
            this.style.display = defaultDisplay(this.nodeName)
        })
      },
      replaceWith: function(newContent){
        return this.before(newContent).remove()
      },
      wrap: function(structure){
        var func = isFunction(structure)
        if (this[0] && !func)
          var dom   = $(structure).get(0),
              clone = dom.parentNode || this.length > 1
  
        return this.each(function(index){
          $(this).wrapAll(
            func ? structure.call(this, index) :
              clone ? dom.cloneNode(true) : dom
          )
        })
      },
      wrapAll: function(structure){
        if (this[0]) {
          $(this[0]).before(structure = $(structure))
          var children
          // drill down to the inmost element
          while ((children = structure.children()).length) structure = children.first()
          $(structure).append(this)
        }
        return this
      },
      wrapInner: function(structure){
        var func = isFunction(structure)
        return this.each(function(index){
          var self = $(this), contents = self.contents(),
              dom  = func ? structure.call(this, index) : structure
          contents.length ? contents.wrapAll(dom) : self.append(dom)
        })
      },
      unwrap: function(){
        this.parent().each(function(){
          $(this).replaceWith($(this).children())
        })
        return this
      },
      clone: function(){
        return this.map(function(){ return this.cloneNode(true) })
      },
      hide: function(){
        return this.css("display", "none")
      },
      toggle: function(setting){
        return this.each(function(){
          var el = $(this)
          ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
        })
      },
      prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
      next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
      html: function(html){
        return html === undefined ?
          (this.length > 0 ? this[0].innerHTML : null) :
          this.each(function(idx){
            var originHtml = this.innerHTML
            $(this).empty().append( funcArg(this, html, idx, originHtml) )
          })
      },
      text: function(text){
        return text === undefined ?
          (this.length > 0 ? this[0].textContent : null) :
          this.each(function(){ this.textContent = text })
      },
      attr: function(name, value){
        var result
        return (typeof name == 'string' && value === undefined) ?
          (this.length == 0 || this[0].nodeType !== 1 ? undefined :
            (name == 'value' && this[0].nodeName == 'INPUT') ? this.val() :
            (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
          ) :
          this.each(function(idx){
            if (this.nodeType !== 1) return
            if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
            else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
          })
      },
      removeAttr: function(name){
        return this.each(function(){ this.nodeType === 1 && setAttribute(this, name) })
      },
      prop: function(name, value){
        return (value === undefined) ?
          (this[0] && this[0][name]) :
          this.each(function(idx){
            this[name] = funcArg(this, value, idx, this[name])
          })
      },
      data: function(name, value){
        var data = this.attr('data-' + dasherize(name), value)
        return data !== null ? deserializeValue(data) : undefined
      },
      val: function(value){
        return (value === undefined) ?
          (this[0] && (this[0].multiple ?
             $(this[0]).find('option').filter(function(o){ return this.selected }).pluck('value') :
             this[0].value)
          ) :
          this.each(function(idx){
            this.value = funcArg(this, value, idx, this.value)
          })
      },
      offset: function(coordinates){
        if (coordinates) return this.each(function(index){
          var $this = $(this),
              coords = funcArg(this, coordinates, index, $this.offset()),
              parentOffset = $this.offsetParent().offset(),
              props = {
                top:  coords.top  - parentOffset.top,
                left: coords.left - parentOffset.left
              }
  
          if ($this.css('position') == 'static') props['position'] = 'relative'
          $this.css(props)
        })
        if (this.length==0) return null
        var obj = this[0].getBoundingClientRect()
        return {
          left: obj.left + window.pageXOffset,
          top: obj.top + window.pageYOffset,
          width: Math.round(obj.width),
          height: Math.round(obj.height)
        }
      },
      css: function(property, value){
        if (arguments.length < 2 && typeof property == 'string')
          return this[0] && (this[0].style[camelize(property)] || getComputedStyle(this[0], '').getPropertyValue(property))
  
        var css = ''
        if (type(property) == 'string') {
          if (!value && value !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(property)) })
          else
            css = dasherize(property) + ":" + maybeAddPx(property, value)
        } else {
          for (key in property)
            if (!property[key] && property[key] !== 0)
              this.each(function(){ this.style.removeProperty(dasherize(key)) })
            else
              css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
        }
  
        return this.each(function(){ this.style.cssText += ';' + css })
      },
      index: function(element){
        return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
      },
      hasClass: function(name){
        return emptyArray.some.call(this, function(el){
          return this.test(className(el))
        }, classRE(name))
      },
      addClass: function(name){
        return this.each(function(idx){
          classList = []
          var cls = className(this), newName = funcArg(this, name, idx, cls)
          newName.split(/\s+/g).forEach(function(klass){
            if (!$(this).hasClass(klass)) classList.push(klass)
          }, this)
          classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
        })
      },
      removeClass: function(name){
        return this.each(function(idx){
          if (name === undefined) return className(this, '')
          classList = className(this)
          funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
            classList = classList.replace(classRE(klass), " ")
          })
          className(this, classList.trim())
        })
      },
      toggleClass: function(name, when){
        return this.each(function(idx){
          var $this = $(this), names = funcArg(this, name, idx, className(this))
          names.split(/\s+/g).forEach(function(klass){
            (when === undefined ? !$this.hasClass(klass) : when) ?
              $this.addClass(klass) : $this.removeClass(klass)
          })
        })
      },
      scrollTop: function(){
        if (!this.length) return
        return ('scrollTop' in this[0]) ? this[0].scrollTop : this[0].scrollY
      },
      position: function() {
        if (!this.length) return
  
        var elem = this[0],
          // Get *real* offsetParent
          offsetParent = this.offsetParent(),
          // Get correct offsets
          offset       = this.offset(),
          parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()
  
        // Subtract element margins
        // note: when an element has margin: auto the offsetLeft and marginLeft
        // are the same in Safari causing offset.left to incorrectly be 0
        offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
        offset.left -= parseFloat( $(elem).css('margin-left') ) || 0
  
        // Add offsetParent borders
        parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
        parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0
  
        // Subtract the two offsets
        return {
          top:  offset.top  - parentOffset.top,
          left: offset.left - parentOffset.left
        }
      },
      offsetParent: function() {
        return this.map(function(){
          var parent = this.offsetParent || document.body
          while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
            parent = parent.offsetParent
          return parent
        })
      }
    }
  
    // for now
    $.fn.detach = $.fn.remove
  
    // Generate the `width` and `height` functions
    ;['width', 'height'].forEach(function(dimension){
      $.fn[dimension] = function(value){
        var offset, el = this[0],
          Dimension = dimension.replace(/./, function(m){ return m[0].toUpperCase() })
        if (value === undefined) return isWindow(el) ? el['inner' + Dimension] :
          isDocument(el) ? el.documentElement['offset' + Dimension] :
          (offset = this.offset()) && offset[dimension]
        else return this.each(function(idx){
          el = $(this)
          el.css(dimension, funcArg(this, value, idx, el[dimension]()))
        })
      }
    })
  
    function traverseNode(node, fun) {
      fun(node)
      for (var key in node.childNodes) traverseNode(node.childNodes[key], fun)
    }
  
    // Generate the `after`, `prepend`, `before`, `append`,
    // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
    adjacencyOperators.forEach(function(operator, operatorIndex) {
      var inside = operatorIndex % 2 //=> prepend, append
  
      $.fn[operator] = function(){
        // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
        var argType, nodes = $.map(arguments, function(arg) {
              argType = type(arg)
              return argType == "object" || argType == "array" || arg == null ?
                arg : zepto.fragment(arg)
            }),
            parent, copyByClone = this.length > 1
        if (nodes.length < 1) return this
  
        return this.each(function(_, target){
          parent = inside ? target : target.parentNode
  
          // convert all methods to a "before" operation
          target = operatorIndex == 0 ? target.nextSibling :
                   operatorIndex == 1 ? target.firstChild :
                   operatorIndex == 2 ? target :
                   null
  
          nodes.forEach(function(node){
            if (copyByClone) node = node.cloneNode(true)
            else if (!parent) return $(node).remove()
  
            traverseNode(parent.insertBefore(node, target), function(el){
              if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
                 (!el.type || el.type === 'text/javascript') && !el.src)
                window['eval'].call(window, el.innerHTML)
            })
          })
        })
      }
  
      // after    => insertAfter
      // prepend  => prependTo
      // before   => insertBefore
      // append   => appendTo
      $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
        $(html)[operator](this)
        return this
      }
    })
  
    zepto.Z.prototype = $.fn
  
    // Export internal API functions in the `$.zepto` namespace
    zepto.uniq = uniq
    zepto.deserializeValue = deserializeValue
    $.zepto = zepto
  
    return $
  })()
  
  window.Zepto = Zepto
  '$' in window || (window.$ = Zepto)
  
  ;(function($){
    function detect(ua){
      var os = this.os = {}, browser = this.browser = {},
        webkit = ua.match(/WebKit\/([\d.]+)/),
        android = ua.match(/(Android)\s+([\d.]+)/),
        ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
        iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
        webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
        touchpad = webos && ua.match(/TouchPad/),
        kindle = ua.match(/Kindle\/([\d.]+)/),
        silk = ua.match(/Silk\/([\d._]+)/),
        blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
        bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
        rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
        playbook = ua.match(/PlayBook/),
        chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
        firefox = ua.match(/Firefox\/([\d.]+)/)
  
      // Todo: clean this up with a better OS/browser seperation:
      // - discern (more) between multiple browsers on android
      // - decide if kindle fire in silk mode is android or not
      // - Firefox on Android doesn't specify the Android version
      // - possibly devide in os, device and browser hashes
  
      if (browser.webkit = !!webkit) browser.version = webkit[1]
  
      if (android) os.android = true, os.version = android[2]
      if (iphone) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.')
      if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.')
      if (webos) os.webos = true, os.version = webos[2]
      if (touchpad) os.touchpad = true
      if (blackberry) os.blackberry = true, os.version = blackberry[2]
      if (bb10) os.bb10 = true, os.version = bb10[2]
      if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2]
      if (playbook) browser.playbook = true
      if (kindle) os.kindle = true, os.version = kindle[1]
      if (silk) browser.silk = true, browser.version = silk[1]
      if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true
      if (chrome) browser.chrome = true, browser.version = chrome[1]
      if (firefox) browser.firefox = true, browser.version = firefox[1]
  
      os.tablet = !!(ipad || playbook || (android && !ua.match(/Mobile/)) || (firefox && ua.match(/Tablet/)))
      os.phone  = !!(!os.tablet && (android || iphone || webos || blackberry || bb10 ||
        (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) || (firefox && ua.match(/Mobile/))))
    }
  
    detect.call($, navigator.userAgent)
    // make available to unit tests
    $.__detect = detect
  
  })(Zepto)
  
  ;(function($){
    var $$ = $.zepto.qsa, handlers = {}, _zid = 1, specialEvents={},
        hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }
  
    specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'
  
    function zid(element) {
      return element._zid || (element._zid = _zid++)
    }
    function findHandlers(element, event, fn, selector) {
      event = parse(event)
      if (event.ns) var matcher = matcherFor(event.ns)
      return (handlers[zid(element)] || []).filter(function(handler) {
        return handler
          && (!event.e  || handler.e == event.e)
          && (!event.ns || matcher.test(handler.ns))
          && (!fn       || zid(handler.fn) === zid(fn))
          && (!selector || handler.sel == selector)
      })
    }
    function parse(event) {
      var parts = ('' + event).split('.')
      return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
    }
    function matcherFor(ns) {
      return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
    }
  
    function eachEvent(events, fn, iterator){
      if ($.type(events) != "string") $.each(events, iterator)
      else events.split(/\s/).forEach(function(type){ iterator(type, fn) })
    }
  
    function eventCapture(handler, captureSetting) {
      return handler.del &&
        (handler.e == 'focus' || handler.e == 'blur') ||
        !!captureSetting
    }
  
    function realEvent(type) {
      return hover[type] || type
    }
  
    function add(element, events, fn, selector, getDelegate, capture){
      var id = zid(element), set = (handlers[id] || (handlers[id] = []))
      eachEvent(events, fn, function(event, fn){
        var handler   = parse(event)
        handler.fn    = fn
        handler.sel   = selector
        // emulate mouseenter, mouseleave
        if (handler.e in hover) fn = function(e){
          var related = e.relatedTarget
          if (!related || (related !== this && !$.contains(this, related)))
            return handler.fn.apply(this, arguments)
        }
        handler.del   = getDelegate && getDelegate(fn, event)
        var callback  = handler.del || fn
        handler.proxy = function (e) {
          var result = callback.apply(element, [e].concat(e.data))
          if (result === false) e.preventDefault(), e.stopPropagation()
          return result
        }
        handler.i = set.length
        set.push(handler)
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    }
    function remove(element, events, fn, selector, capture){
      var id = zid(element)
      eachEvent(events || '', fn, function(event, fn){
        findHandlers(element, event, fn, selector).forEach(function(handler){
          delete handlers[id][handler.i]
          element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
        })
      })
    }
  
    $.event = { add: add, remove: remove }
  
    $.proxy = function(fn, context) {
      if ($.isFunction(fn)) {
        var proxyFn = function(){ return fn.apply(context, arguments) }
        proxyFn._zid = zid(fn)
        return proxyFn
      } else if (typeof context == 'string') {
        return $.proxy(fn[context], fn)
      } else {
        throw new TypeError("expected function")
      }
    }
  
    $.fn.bind = function(event, callback){
      return this.each(function(){
        add(this, event, callback)
      })
    }
    $.fn.unbind = function(event, callback){
      return this.each(function(){
        remove(this, event, callback)
      })
    }
    $.fn.one = function(event, callback){
      return this.each(function(i, element){
        add(this, event, callback, null, function(fn, type){
          return function(){
            var result = fn.apply(element, arguments)
            remove(element, type, fn)
            return result
          }
        })
      })
    }
  
    var returnTrue = function(){return true},
        returnFalse = function(){return false},
        ignoreProperties = /^([A-Z]|layer[XY]$)/,
        eventMethods = {
          preventDefault: 'isDefaultPrevented',
          stopImmediatePropagation: 'isImmediatePropagationStopped',
          stopPropagation: 'isPropagationStopped'
        }
    function createProxy(event) {
      var key, proxy = { originalEvent: event }
      for (key in event)
        if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]
  
      $.each(eventMethods, function(name, predicate) {
        proxy[name] = function(){
          this[predicate] = returnTrue
          return event[name].apply(event, arguments)
        }
        proxy[predicate] = returnFalse
      })
      return proxy
    }
  
    // emulates the 'defaultPrevented' property for browsers that have none
    function fix(event) {
      if (!('defaultPrevented' in event)) {
        event.defaultPrevented = false
        var prevent = event.preventDefault
        event.preventDefault = function() {
          this.defaultPrevented = true
          prevent.call(this)
        }
      }
    }
  
    $.fn.delegate = function(selector, event, callback){
      return this.each(function(i, element){
        add(element, event, callback, selector, function(fn){
          return function(e){
            var evt, match = $(e.target).closest(selector, element).get(0)
            if (match) {
              evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
              return fn.apply(match, [evt].concat([].slice.call(arguments, 1)))
            }
          }
        })
      })
    }
    $.fn.undelegate = function(selector, event, callback){
      return this.each(function(){
        remove(this, event, callback, selector)
      })
    }
  
    $.fn.live = function(event, callback){
      $(document.body).delegate(this.selector, event, callback)
      return this
    }
    $.fn.die = function(event, callback){
      $(document.body).undelegate(this.selector, event, callback)
      return this
    }
  
    $.fn.on = function(event, selector, callback){
      return !selector || $.isFunction(selector) ?
        this.bind(event, selector || callback) : this.delegate(selector, event, callback)
    }
    $.fn.off = function(event, selector, callback){
      return !selector || $.isFunction(selector) ?
        this.unbind(event, selector || callback) : this.undelegate(selector, event, callback)
    }
  
    $.fn.trigger = function(event, data){
      if (typeof event == 'string' || $.isPlainObject(event)) event = $.Event(event)
      fix(event)
      event.data = data
      return this.each(function(){
        // items in the collection might not be DOM elements
        // (todo: possibly support events on plain old objects)
        if('dispatchEvent' in this) this.dispatchEvent(event)
      })
    }
  
    // triggers event handlers on current element just as if an event occurred,
    // doesn't trigger an actual event, doesn't bubble
    $.fn.triggerHandler = function(event, data){
      var e, result
      this.each(function(i, element){
        e = createProxy(typeof event == 'string' ? $.Event(event) : event)
        e.data = data
        e.target = element
        $.each(findHandlers(element, event.type || event), function(i, handler){
          result = handler.proxy(e)
          if (e.isImmediatePropagationStopped()) return false
        })
      })
      return result
    }
  
    // shortcut methods for `.bind(event, fn)` for each event type
    ;('focusin focusout load resize scroll unload click dblclick '+
    'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
    'change select keydown keypress keyup error').split(' ').forEach(function(event) {
      $.fn[event] = function(callback) {
        return callback ?
          this.bind(event, callback) :
          this.trigger(event)
      }
    })
  
    ;['focus', 'blur'].forEach(function(name) {
      $.fn[name] = function(callback) {
        if (callback) this.bind(name, callback)
        else this.each(function(){
          try { this[name]() }
          catch(e) {}
        })
        return this
      }
    })
  
    $.Event = function(type, props) {
      if (typeof type != 'string') props = type, type = props.type
      var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
      if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
      event.initEvent(type, bubbles, true, null, null, null, null, null, null, null, null, null, null, null, null)
      event.isDefaultPrevented = function(){ return this.defaultPrevented }
      return event
    }
  
  })(Zepto)
  
  ;(function($){
    var jsonpID = 0,
        document = window.document,
        key,
        name,
        rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        scriptTypeRE = /^(?:text|application)\/javascript/i,
        xmlTypeRE = /^(?:text|application)\/xml/i,
        jsonType = 'application/json',
        htmlType = 'text/html',
        blankRE = /^\s*$/
  
    // trigger a custom event and return false if it was cancelled
    function triggerAndReturn(context, eventName, data) {
      var event = $.Event(eventName)
      $(context).trigger(event, data)
      return !event.defaultPrevented
    }
  
    // trigger an Ajax "global" event
    function triggerGlobal(settings, context, eventName, data) {
      if (settings.global) return triggerAndReturn(context || document, eventName, data)
    }
  
    // Number of active Ajax requests
    $.active = 0
  
    function ajaxStart(settings) {
      if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
    }
    function ajaxStop(settings) {
      if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
    }
  
    // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
    function ajaxBeforeSend(xhr, settings) {
      var context = settings.context
      if (settings.beforeSend.call(context, xhr, settings) === false ||
          triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
        return false
  
      triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
    }
    function ajaxSuccess(data, xhr, settings) {
      var context = settings.context, status = 'success'
      settings.success.call(context, data, status, xhr)
      triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
      ajaxComplete(status, xhr, settings)
    }
    // type: "timeout", "error", "abort", "parsererror"
    function ajaxError(error, type, xhr, settings) {
      var context = settings.context
      settings.error.call(context, xhr, type, error)
      triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error])
      ajaxComplete(type, xhr, settings)
    }
    // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
    function ajaxComplete(status, xhr, settings) {
      var context = settings.context
      settings.complete.call(context, xhr, status)
      triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
      ajaxStop(settings)
    }
  
    // Empty function, used as default callback
    function empty() {}
  
    $.ajaxJSONP = function(options){
      if (!('type' in options)) return $.ajax(options)
  
      var callbackName = 'jsonp' + (++jsonpID),
        script = document.createElement('script'),
        cleanup = function() {
          clearTimeout(abortTimeout)
          $(script).remove()
          delete window[callbackName]
        },
        abort = function(type){
          cleanup()
          // In case of manual abort or timeout, keep an empty function as callback
          // so that the SCRIPT tag that eventually loads won't result in an error.
          if (!type || type == 'timeout') window[callbackName] = empty
          ajaxError(null, type || 'abort', xhr, options)
        },
        xhr = { abort: abort }, abortTimeout
  
      if (ajaxBeforeSend(xhr, options) === false) {
        abort('abort')
        return false
      }
  
      window[callbackName] = function(data){
        cleanup()
        ajaxSuccess(data, xhr, options)
      }
  
      script.onerror = function() { abort('error') }
  
      script.src = options.url.replace(/=\?/, '=' + callbackName)
      $('head').append(script)
  
      if (options.timeout > 0) abortTimeout = setTimeout(function(){
        abort('timeout')
      }, options.timeout)
  
      return xhr
    }
  
    $.ajaxSettings = {
      // Default type of request
      type: 'GET',
      // Callback that is executed before request
      beforeSend: empty,
      // Callback that is executed if the request succeeds
      success: empty,
      // Callback that is executed the the server drops error
      error: empty,
      // Callback that is executed on request complete (both: error and success)
      complete: empty,
      // The context for the callbacks
      context: null,
      // Whether to trigger "global" Ajax events
      global: true,
      // Transport
      xhr: function () {
        return new window.XMLHttpRequest()
      },
      // MIME types mapping
      accepts: {
        script: 'text/javascript, application/javascript',
        json:   jsonType,
        xml:    'application/xml, text/xml',
        html:   htmlType,
        text:   'text/plain'
      },
      // Whether the request is to another domain
      crossDomain: false,
      // Default timeout
      timeout: 0,
      // Whether data should be serialized to string
      processData: true,
      // Whether the browser should be allowed to cache GET responses
      cache: true,
    }
  
    function mimeToDataType(mime) {
      if (mime) mime = mime.split(';', 2)[0]
      return mime && ( mime == htmlType ? 'html' :
        mime == jsonType ? 'json' :
        scriptTypeRE.test(mime) ? 'script' :
        xmlTypeRE.test(mime) && 'xml' ) || 'text'
    }
  
    function appendQuery(url, query) {
      return (url + '&' + query).replace(/[&?]{1,2}/, '?')
    }
  
    // serialize payload and append it to the URL for GET requests
    function serializeData(options) {
      if (options.processData && options.data && $.type(options.data) != "string")
        options.data = $.param(options.data, options.traditional)
      if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
        options.url = appendQuery(options.url, options.data)
    }
  
    $.ajax = function(options){
      var settings = $.extend({}, options || {})
      for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]
  
      ajaxStart(settings)
  
      if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
        RegExp.$2 != window.location.host
  
      if (!settings.url) settings.url = window.location.toString()
      serializeData(settings)
      if (settings.cache === false) settings.url = appendQuery(settings.url, '_=' + Date.now())
  
      var dataType = settings.dataType, hasPlaceholder = /=\?/.test(settings.url)
      if (dataType == 'jsonp' || hasPlaceholder) {
        if (!hasPlaceholder) settings.url = appendQuery(settings.url, 'callback=?')
        return $.ajaxJSONP(settings)
      }
  
      var mime = settings.accepts[dataType],
          baseHeaders = { },
          protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
          xhr = settings.xhr(), abortTimeout
  
      if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest'
      if (mime) {
        baseHeaders['Accept'] = mime
        if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
        xhr.overrideMimeType && xhr.overrideMimeType(mime)
      }
      if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
        baseHeaders['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded')
      settings.headers = $.extend(baseHeaders, settings.headers || {})
  
      xhr.onreadystatechange = function(){
        if (xhr.readyState == 4) {
          xhr.onreadystatechange = empty;
          clearTimeout(abortTimeout)
          var result, error = false
          if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
            dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))
            result = xhr.responseText
  
            try {
              // http://perfectionkills.com/global-eval-what-are-the-options/
              if (dataType == 'script')    (1,eval)(result)
              else if (dataType == 'xml')  result = xhr.responseXML
              else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
            } catch (e) { error = e }
  
            if (error) ajaxError(error, 'parsererror', xhr, settings)
            else ajaxSuccess(result, xhr, settings)
          } else {
            ajaxError(null, xhr.status ? 'error' : 'abort', xhr, settings)
          }
        }
      }
  
      var async = 'async' in settings ? settings.async : true
      xhr.open(settings.type, settings.url, async)
  
      for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name])
  
      if (ajaxBeforeSend(xhr, settings) === false) {
        xhr.abort()
        return false
      }
  
      if (settings.timeout > 0) abortTimeout = setTimeout(function(){
          xhr.onreadystatechange = empty
          xhr.abort()
          ajaxError(null, 'timeout', xhr, settings)
        }, settings.timeout)
  
      // avoid sending empty string (#319)
      xhr.send(settings.data ? settings.data : null)
      return xhr
    }
  
    // handle optional data/success arguments
    function parseArguments(url, data, success, dataType) {
      var hasData = !$.isFunction(data)
      return {
        url:      url,
        data:     hasData  ? data : undefined,
        success:  !hasData ? data : $.isFunction(success) ? success : undefined,
        dataType: hasData  ? dataType || success : success
      }
    }
  
    $.get = function(url, data, success, dataType){
      return $.ajax(parseArguments.apply(null, arguments))
    }
  
    $.post = function(url, data, success, dataType){
      var options = parseArguments.apply(null, arguments)
      options.type = 'POST'
      return $.ajax(options)
    }
  
    $.getJSON = function(url, data, success){
      var options = parseArguments.apply(null, arguments)
      options.dataType = 'json'
      return $.ajax(options)
    }
  
    $.fn.load = function(url, data, success){
      if (!this.length) return this
      var self = this, parts = url.split(/\s/), selector,
          options = parseArguments(url, data, success),
          callback = options.success
      if (parts.length > 1) options.url = parts[0], selector = parts[1]
      options.success = function(response){
        self.html(selector ?
          $('<div>').html(response.replace(rscript, "")).find(selector)
          : response)
        callback && callback.apply(self, arguments)
      }
      $.ajax(options)
      return this
    }
  
    var escape = encodeURIComponent
  
    function serialize(params, obj, traditional, scope){
      var type, array = $.isArray(obj)
      $.each(obj, function(key, value) {
        type = $.type(value)
        if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'
        // handle data in serializeArray() format
        if (!scope && array) params.add(value.name, value.value)
        // recurse into nested objects
        else if (type == "array" || (!traditional && type == "object"))
          serialize(params, value, traditional, key)
        else params.add(key, value)
      })
    }
  
    $.param = function(obj, traditional){
      var params = []
      params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }
      serialize(params, obj, traditional)
      return params.join('&').replace(/%20/g, '+')
    }
  })(Zepto)
  
  ;(function ($) {
    $.fn.serializeArray = function () {
      var result = [], el
      $( Array.prototype.slice.call(this.get(0).elements) ).each(function () {
        el = $(this)
        var type = el.attr('type')
        if (this.nodeName.toLowerCase() != 'fieldset' &&
          !this.disabled && type != 'submit' && type != 'reset' && type != 'button' &&
          ((type != 'radio' && type != 'checkbox') || this.checked))
          result.push({
            name: el.attr('name'),
            value: el.val()
          })
      })
      return result
    }
  
    $.fn.serialize = function () {
      var result = []
      this.serializeArray().forEach(function (elm) {
        result.push( encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value) )
      })
      return result.join('&')
    }
  
    $.fn.submit = function (callback) {
      if (callback) this.bind('submit', callback)
      else if (this.length) {
        var event = $.Event('submit')
        this.eq(0).trigger(event)
        if (!event.defaultPrevented) this.get(0).submit()
      }
      return this
    }
  
  })(Zepto)
  
  ;(function($, undefined){
    var prefix = '', eventPrefix, endEventName, endAnimationName,
      vendors = { Webkit: 'webkit', Moz: '', O: 'o', ms: 'MS' },
      document = window.document, testEl = document.createElement('div'),
      supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
      transform,
      transitionProperty, transitionDuration, transitionTiming,
      animationName, animationDuration, animationTiming,
      cssReset = {}
  
    function dasherize(str) { return downcase(str.replace(/([a-z])([A-Z])/, '$1-$2')) }
    function downcase(str) { return str.toLowerCase() }
    function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : downcase(name) }
  
    $.each(vendors, function(vendor, event){
      if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
        prefix = '-' + downcase(vendor) + '-'
        eventPrefix = event
        return false
      }
    })
  
    transform = prefix + 'transform'
    cssReset[transitionProperty = prefix + 'transition-property'] =
    cssReset[transitionDuration = prefix + 'transition-duration'] =
    cssReset[transitionTiming   = prefix + 'transition-timing-function'] =
    cssReset[animationName      = prefix + 'animation-name'] =
    cssReset[animationDuration  = prefix + 'animation-duration'] =
    cssReset[animationTiming    = prefix + 'animation-timing-function'] = ''
  
    $.fx = {
      off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
      speeds: { _default: 400, fast: 200, slow: 600 },
      cssPrefix: prefix,
      transitionEnd: normalizeEvent('TransitionEnd'),
      animationEnd: normalizeEvent('AnimationEnd')
    }
  
    $.fn.animate = function(properties, duration, ease, callback){
      if ($.isPlainObject(duration))
        ease = duration.easing, callback = duration.complete, duration = duration.duration
      if (duration) duration = (typeof duration == 'number' ? duration :
                      ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
      return this.anim(properties, duration, ease, callback)
    }
  
    $.fn.anim = function(properties, duration, ease, callback){
      var key, cssValues = {}, cssProperties, transforms = '',
          that = this, wrappedCallback, endEvent = $.fx.transitionEnd
  
      if (duration === undefined) duration = 0.4
      if ($.fx.off) duration = 0
  
      if (typeof properties == 'string') {
        // keyframe animation
        cssValues[animationName] = properties
        cssValues[animationDuration] = duration + 's'
        cssValues[animationTiming] = (ease || 'linear')
        endEvent = $.fx.animationEnd
      } else {
        cssProperties = []
        // CSS transitions
        for (key in properties)
          if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
          else cssValues[key] = properties[key], cssProperties.push(dasherize(key))
  
        if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
        if (duration > 0 && typeof properties === 'object') {
          cssValues[transitionProperty] = cssProperties.join(', ')
          cssValues[transitionDuration] = duration + 's'
          cssValues[transitionTiming] = (ease || 'linear')
        }
      }
  
      wrappedCallback = function(event){
        if (typeof event !== 'undefined') {
          if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
          $(event.target).unbind(endEvent, wrappedCallback)
        }
        $(this).css(cssReset)
        callback && callback.call(this)
      }
      if (duration > 0) this.bind(endEvent, wrappedCallback)
  
      // trigger page reflow so new elements can animate
      this.size() && this.get(0).clientLeft
  
      this.css(cssValues)
  
      if (duration <= 0) setTimeout(function() {
        that.each(function(){ wrappedCallback.call(this) })
      }, 0)
  
      return this
    }
  
    testEl = null
  })(Zepto)
  
  
  
  /********zpto-extend.js**************/
  
  /**
   * @name zepto.extend
   * @file å¯¹Zeptoåšäº†äº›æ‰©å±•ï¼Œä»¥ä¸‹æ‰€æœ‰JSéƒ½ä¾èµ–ä¸Žæ­¤æ–‡ä»¶
   * @desc å¯¹Zeptoä¸€äº›æ‰©å±•ï¼Œç»„ä»¶å¿…é¡»ä¾èµ–
   * @import core/zepto.js
   */
  
  ;(function($){
      $.extend($, {
          contains: function(parent, node) {
              /**
               * modified by chenluyang
               * @reason ios4 safariä¸‹ï¼Œæ— æ³•åˆ¤æ–­åŒ…å«æ–‡å­—èŠ‚ç‚¹çš„æƒ…å†µ
               * @original return parent !== node && parent.contains(node)
               */
              return parent.compareDocumentPosition
                  ? !!(parent.compareDocumentPosition(node) & 16)
                  : parent !== node && parent.contains(node)
          }
      });
  })(Zepto);
  
  
  //Core.js
  ;(function($, undefined) {
      //æ‰©å±•åœ¨Zeptoé™æ€ç±»ä¸Š
      $.extend($, {
          /**
           * @grammar $.toString(obj)  â‡’ string
           * @name $.toString
           * @desc toStringè½¬åŒ–
           */
          toString: function(obj) {
              return Object.prototype.toString.call(obj);
          },
  
          /**
           * @desc ä»Žé›†åˆä¸­æˆªå–éƒ¨åˆ†æ•°æ®ï¼Œè¿™é‡Œè¯´çš„é›†åˆï¼Œå¯ä»¥æ˜¯æ•°ç»„ï¼Œä¹Ÿå¯ä»¥æ˜¯è·Ÿæ•°ç»„æ€§è´¨å¾ˆåƒçš„å¯¹è±¡ï¼Œæ¯”å¦‚arguments
           * @name $.slice
           * @grammar $.slice(collection, [index])  â‡’ array
           * @example (function(){
           *     var args = $.slice(arguments, 2);
           *     console.log(args); // => [3]
           * })(1, 2, 3);
           */
          slice: function(array, index) {
              return Array.prototype.slice.call(array, index || 0);
          },
  
          /**
           * @name $.later
           * @grammar $.later(fn, [when, [periodic, [context, [data]]]])  â‡’ timer
           * @desc å»¶è¿Ÿæ‰§è¡Œfn
           * **å‚æ•°:**
           * - ***fn***: å°†è¦å»¶æ—¶æ‰§è¡Œçš„æ–¹æ³•
           * - ***when***: *å¯é€‰(é»˜è®¤ 0)* ä»€ä¹ˆæ—¶é—´åŽæ‰§è¡Œ
           * - ***periodic***: *å¯é€‰(é»˜è®¤ false)* è®¾å®šæ˜¯å¦æ˜¯å‘¨æœŸæ€§çš„æ‰§è¡Œ
           * - ***context***: *å¯é€‰(é»˜è®¤ undefined)* ç»™æ–¹æ³•è®¾å®šä¸Šä¸‹æ–‡
           * - ***data***: *å¯é€‰(é»˜è®¤ undefined)* ç»™æ–¹æ³•è®¾å®šä¼ å…¥å‚æ•°
           * @example $.later(function(str){
           *     console.log(this.name + ' ' + str); // => Example hello
           * }, 250, false, {name:'Example'}, ['hello']);
           */
          later: function(fn, when, periodic, context, data) {
              return window['set' + (periodic ? 'Interval' : 'Timeout')](function() {
                  fn.apply(context, data);
              }, when || 0);
          },
  
          /**
           * @desc è§£æžæ¨¡ç‰ˆ
           * @grammar $.parseTpl(str, data)  â‡’ string
           * @name $.parseTpl
           * @example var str = "<p><%=name%></p>",
           * obj = {name: 'ajean'};
           * console.log($.parseTpl(str, data)); // => <p>ajean</p>
           */
          parseTpl: function(str, data) {
              var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' + 'with(obj||{}){__p.push(\'' + str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/<%=([\s\S]+?)%>/g, function(match, code) {
                  return "'," + code.replace(/\\'/g, "'") + ",'";
              }).replace(/<%([\s\S]+?)%>/g, function(match, code) {
                      return "');" + code.replace(/\\'/g, "'").replace(/[\r\n\t]/g, ' ') + "__p.push('";
                  }).replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + "');}return __p.join('');";
              var func = new Function('obj', tmpl);
              return data ? func(data) : func;
          },
  
          /**
           * @desc å‡å°‘æ‰§è¡Œé¢‘çŽ‡, å¤šæ¬¡è°ƒç”¨ï¼Œåœ¨æŒ‡å®šçš„æ—¶é—´å†…ï¼Œåªä¼šæ‰§è¡Œä¸€æ¬¡ã€‚
           * **options:**
           * - ***delay***: å»¶æ—¶æ—¶é—´
           * - ***fn***: è¢«ç¨€é‡Šçš„æ–¹æ³•
           * - ***debounce_mode***: æ˜¯å¦å¼€å¯é˜²éœ‡åŠ¨æ¨¡å¼, true:start, false:end
           *
           * <code type="text">||||||||||||||||||||||||| (ç©ºé—²) |||||||||||||||||||||||||
           * X    X    X    X    X    X      X    X    X    X    X    X</code>
           *
           * @grammar $.throttle(delay, fn) â‡’ function
           * @name $.throttle
           * @example var touchmoveHander = function(){
           *     //....
           * }
           * //ç»‘å®šäº‹ä»¶
           * $(document).bind('touchmove', $.throttle(250, touchmoveHander));//é¢‘ç¹æ»šåŠ¨ï¼Œæ¯250msï¼Œæ‰§è¡Œä¸€æ¬¡touchmoveHandler
           *
           * //è§£ç»‘äº‹ä»¶
           * $(document).unbind('touchmove', touchmoveHander);//æ³¨æ„è¿™é‡Œé¢unbindè¿˜æ˜¯touchmoveHander,è€Œä¸æ˜¯$.throttleè¿”å›žçš„function, å½“ç„¶unbindé‚£ä¸ªä¹Ÿæ˜¯ä¸€æ ·çš„æ•ˆæžœ
           *
           */
          throttle: function(delay, fn, debounce_mode) {
              var last = 0,
                  timeId;
  
              if (typeof fn !== 'function') {
                  debounce_mode = fn;
                  fn = delay;
                  delay = 250;
              }
  
              function wrapper() {
                  var that = this,
                      period = Date.now() - last,
                      args = arguments;
  
                  function exec() {
                      last = Date.now();
                      fn.apply(that, args);
                  };
  
                  function clear() {
                      timeId = undefined;
                  };
  
                  if (debounce_mode && !timeId) {
                      // debounceæ¨¡å¼ && ç¬¬ä¸€æ¬¡è°ƒç”¨
                      exec();
                  }
  
                  timeId && clearTimeout(timeId);
                  if (debounce_mode === undefined && period > delay) {
                      // throttle, æ‰§è¡Œåˆ°äº†delayæ—¶é—´
                      exec();
                  } else {
                      // debounce, å¦‚æžœæ˜¯startå°±clearTimeout
                      timeId = setTimeout(debounce_mode ? clear : exec, debounce_mode === undefined ? delay - period : delay);
                  }
              };
              // for event bind | unbind
              wrapper._zid = fn._zid = fn._zid || $.proxy(fn)._zid;
              return wrapper;
          },
  
          /**
           * @desc å‡å°‘æ‰§è¡Œé¢‘çŽ‡, åœ¨æŒ‡å®šçš„æ—¶é—´å†…, å¤šæ¬¡è°ƒç”¨ï¼Œåªä¼šæ‰§è¡Œä¸€æ¬¡ã€‚
           * **options:**
           * - ***delay***: å»¶æ—¶æ—¶é—´
           * - ***fn***: è¢«ç¨€é‡Šçš„æ–¹æ³•
           * - ***t***: æŒ‡å®šæ˜¯åœ¨å¼€å§‹å¤„æ‰§è¡Œï¼Œè¿˜æ˜¯ç»“æŸæ˜¯æ‰§è¡Œ, true:start, false:end
           *
           * éžat_beginæ¨¡å¼
           * <code type="text">||||||||||||||||||||||||| (ç©ºé—²) |||||||||||||||||||||||||
           *                         X                                X</code>
           * at_beginæ¨¡å¼
           * <code type="text">||||||||||||||||||||||||| (ç©ºé—²) |||||||||||||||||||||||||
           * X                                X                        </code>
           *
           * @grammar $.debounce(delay, fn[, at_begin]) â‡’ function
           * @name $.debounce
           * @example var touchmoveHander = function(){
           *     //....
           * }
           * //ç»‘å®šäº‹ä»¶
           * $(document).bind('touchmove', $.debounce(250, touchmoveHander));//é¢‘ç¹æ»šåŠ¨ï¼Œåªè¦é—´éš”æ—¶é—´ä¸å¤§äºŽ250ms, åœ¨ä¸€ç³»åˆ—ç§»åŠ¨åŽï¼Œåªä¼šæ‰§è¡Œä¸€æ¬¡
           *
           * //è§£ç»‘äº‹ä»¶
           * $(document).unbind('touchmove', touchmoveHander);//æ³¨æ„è¿™é‡Œé¢unbindè¿˜æ˜¯touchmoveHander,è€Œä¸æ˜¯$.debounceè¿”å›žçš„function, å½“ç„¶unbindé‚£ä¸ªä¹Ÿæ˜¯ä¸€æ ·çš„æ•ˆæžœ
           */
          debounce: function(delay, fn, t) {
              return fn === undefined ? $.throttle(250, delay, false) : $.throttle(delay, fn, t === undefined ? false : t !== false);
          }
      });
  
      /**
       * æ‰©å±•ç±»åž‹åˆ¤æ–­
       * @param {Any} obj
       * @see isString, isBoolean, isRegExp, isNumber, isDate, isObject, isNull, isUdefined
       */
      /**
       * @name $.isString
       * @grammar $.isString(val)  â‡’ Boolean
       * @desc åˆ¤æ–­å˜é‡ç±»åž‹æ˜¯å¦ä¸º***String***
       * @example console.log($.isString({}));// => false
       * console.log($.isString(123));// => false
       * console.log($.isString('123'));// => true
       */
      /**
       * @name $.isBoolean
       * @grammar $.isBoolean(val)  â‡’ Boolean
       * @desc åˆ¤æ–­å˜é‡ç±»åž‹æ˜¯å¦ä¸º***Boolean***
       * @example console.log($.isBoolean(1));// => false
       * console.log($.isBoolean('true'));// => false
       * console.log($.isBoolean(false));// => true
       */
      /**
       * @name $.isRegExp
       * @grammar $.isRegExp(val)  â‡’ Boolean
       * @desc åˆ¤æ–­å˜é‡ç±»åž‹æ˜¯å¦ä¸º***RegExp***
       * @example console.log($.isRegExp(1));// => false
       * console.log($.isRegExp('test'));// => false
       * console.log($.isRegExp(/test/));// => true
       */
      /**
       * @name $.isNumber
       * @grammar $.isNumber(val)  â‡’ Boolean
       * @desc åˆ¤æ–­å˜é‡ç±»åž‹æ˜¯å¦ä¸º***Number***
       * @example console.log($.isNumber('123'));// => false
       * console.log($.isNumber(true));// => false
       * console.log($.isNumber(123));// => true
       */
      /**
       * @name $.isDate
       * @grammar $.isDate(val)  â‡’ Boolean
       * @desc åˆ¤æ–­å˜é‡ç±»åž‹æ˜¯å¦ä¸º***Date***
       * @example console.log($.isDate('123'));// => false
       * console.log($.isDate('2012-12-12'));// => false
       * console.log($.isDate(new Date()));// => true
       */
      /**
       * @name $.isObject
       * @grammar $.isObject(val)  â‡’ Boolean
       * @desc åˆ¤æ–­å˜é‡ç±»åž‹æ˜¯å¦ä¸º***Object***
       * @example console.log($.isObject('123'));// => false
       * console.log($.isObject(true));// => false
       * console.log($.isObject({}));// => true
       */
      /**
       * @name $.isNull
       * @grammar $.isNull(val)  â‡’ Boolean
       * @desc åˆ¤æ–­å˜é‡ç±»åž‹æ˜¯å¦ä¸º***null***
       * @example console.log($.isNull(false));// => false
       * console.log($.isNull(0));// => false
       * console.log($.isNull(null));// => true
       */
      /**
       * @name $.isUndefined
       * @grammar $.isUndefined(val)  â‡’ Boolean
       * @desc åˆ¤æ–­å˜é‡ç±»åž‹æ˜¯å¦ä¸º***undefined***
       * @example
       * console.log($.isUndefined(false));// => false
       * console.log($.isUndefined(0));// => false
       * console.log($.isUndefined(a));// => true
       */
      $.each("String Boolean RegExp Number Date Object Null Undefined".split(" "), function( i, name ){
          var fn;
  
          if( 'is' + name in $ ) return;//already defined then ignore.
  
          switch (name) {
              case 'Null':
                  fn = function(obj){ return obj === null; };
                  break;
              case 'Undefined':
                  fn = function(obj){ return obj === undefined; };
                  break;
              default:
                  fn = function(obj){ return new RegExp(name + ']', 'i').test( toString(obj) )};
          }
          $['is'+name] = fn;
      });
  
      var toString = $.toString;
  
  })(Zepto);
  
  //Support.js
  ;(function($, undefined) {
      var ua = navigator.userAgent,
          na = navigator.appVersion,
          br = $.browser;
  
      /**
       * @name $.browser
       * @desc æ‰©å±•zeptoä¸­å¯¹browserçš„æ£€æµ‹
       *
       * **å¯ç”¨å±žæ€§**
       * - ***qq*** æ£€æµ‹qqæµè§ˆå™¨
       * - ***chrome*** æ£€æµ‹chromeæµè§ˆå™¨
       * - ***uc*** æ£€æµ‹ucæµè§ˆå™¨
       * - ***version*** æ£€æµ‹æµè§ˆå™¨ç‰ˆæœ¬
       *
       * @example
       * if ($.browser.qq) {      //åœ¨qqæµè§ˆå™¨ä¸Šæ‰“å‡ºæ­¤log
       *     console.log('this is qq browser');
       * }
       */
      $.extend( br, {
          qq: /qq/i.test(ua),
          uc: /UC/i.test(ua) || /UC/i.test(na)
      } );
  
      br.uc = br.uc || !br.qq && !br.chrome && !br.firefox && !/safari/i.test(ua);
  
      try {
          br.version = br.uc ? na.match(/UC(?:Browser)?\/([\d.]+)/)[1] : br.qq ? ua.match(/MQQBrowser\/([\d.]+)/)[1] : br.version;
      } catch (e) {}
  
  
      /**
       * @name $.support
       * @desc æ£€æµ‹è®¾å¤‡å¯¹æŸäº›å±žæ€§æˆ–æ–¹æ³•çš„æ”¯æŒæƒ…å†µ
       *
       * **å¯ç”¨å±žæ€§**
       * - ***orientation*** æ£€æµ‹æ˜¯å¦æ”¯æŒè½¬å±äº‹ä»¶ï¼ŒUCä¸­å­˜åœ¨orientaionï¼Œä½†è½¬å±ä¸ä¼šè§¦å‘è¯¥äº‹ä»¶ï¼Œæ•…UCå±žäºŽä¸æ”¯æŒè½¬å±äº‹ä»¶(iOS 4ä¸Šqq, chromeéƒ½æœ‰è¿™ä¸ªçŽ°è±¡)
       * - ***touch*** æ£€æµ‹æ˜¯å¦æ”¯æŒtouchç›¸å…³äº‹ä»¶
       * - ***cssTransitions*** æ£€æµ‹æ˜¯å¦æ”¯æŒcss3çš„transition
       * - ***has3d*** æ£€æµ‹æ˜¯å¦æ”¯æŒtranslate3dçš„ç¡¬ä»¶åŠ é€Ÿ
       *
       * @example
       * if ($.support.has3d) {      //åœ¨æ”¯æŒ3dçš„è®¾å¤‡ä¸Šä½¿ç”¨
       *     console.log('you can use transtion3d');
       * }
       */
      $.support = $.extend($.support || {}, {
          orientation: !(br.uc || (parseFloat($.os.version)<5 && (br.qq || br.chrome))) && !($.os.android && parseFloat($.os.version) > 3) && "orientation" in window && "onorientationchange" in window,
          touch: "ontouchend" in document,
          cssTransitions: "WebKitTransitionEvent" in window,
          has3d: 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix()
      });
  
  })(Zepto);
  
  //Event.js
  ;(function($) {
      /**
       * @name $.matchMedia
       * @grammar $.matchMedia(query)  â‡’ MediaQueryList
       * @desc æ˜¯åŽŸç”Ÿçš„window.matchMediaæ–¹æ³•çš„polyfillï¼Œå¯¹äºŽä¸æ”¯æŒmatchMediaçš„æ–¹æ³•ç³»ç»Ÿå’Œæµè§ˆå™¨ï¼ŒæŒ‰ç…§[w3c window.matchMedia](http://www.w3.org/TR/cssom-view/#dom-window-matchmedia)çš„æŽ¥å£
       * å®šä¹‰ï¼Œå¯¹matchMediaæ–¹æ³•è¿›è¡Œäº†å°è£…ã€‚åŽŸç†æ˜¯ç”¨css media queryåŠtransitionEndäº‹ä»¶æ¥å®Œæˆçš„ã€‚åœ¨é¡µé¢ä¸­æ’å…¥media queryæ ·å¼åŠå…ƒç´ ï¼Œå½“queryæ¡ä»¶æ»¡è¶³æ—¶æ”¹å˜è¯¥å…ƒç´ æ ·å¼ï¼ŒåŒæ—¶è¿™ä¸ªæ ·å¼æ˜¯transitionä½œç”¨çš„å±žæ€§ï¼Œ
       * æ»¡è¶³æ¡ä»¶åŽå³ä¼šè§¦å‘transitionEndï¼Œç”±æ­¤åˆ›å»ºMediaQueryListçš„äº‹ä»¶ç›‘å¬ã€‚ç”±äºŽtransitionçš„duration timeä¸º0.001msï¼Œæ•…è‹¥ç›´æŽ¥ä½¿ç”¨MediaQueryListå¯¹è±¡çš„matchesåŽ»åˆ¤æ–­å½“å‰æ˜¯å¦ä¸ŽqueryåŒ¹é…ï¼Œä¼šæœ‰éƒ¨åˆ†å»¶è¿Ÿï¼Œ
       * å»ºè®®æ³¨å†ŒaddListenerçš„æ–¹å¼åŽ»ç›‘å¬queryçš„æ”¹å˜ã€‚$.matchMediaçš„è¯¦ç»†å®žçŽ°åŽŸç†åŠé‡‡ç”¨è¯¥æ–¹æ³•å®žçŽ°çš„è½¬å±ç»Ÿä¸€è§£å†³æ–¹æ¡ˆè¯¦è§
       * [GMU Pages: è½¬å±è§£å†³æ–¹æ¡ˆ($.matchMedia)](https://github.com/gmuteam/GMU/wiki/%E8%BD%AC%E5%B1%8F%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88$.matchMedia)
       *
       * **MediaQueryListå¯¹è±¡åŒ…å«çš„å±žæ€§**
       * - ***matches*** æ˜¯å¦æ»¡è¶³query
       * - ***query*** æŸ¥è¯¢çš„css queryï¼Œç±»ä¼¼\'screen and (orientation: portrait)\'
       * - ***addListener*** æ·»åŠ MediaQueryListå¯¹è±¡ç›‘å¬å™¨ï¼ŒæŽ¥æ”¶å›žè°ƒå‡½æ•°ï¼Œå›žè°ƒå‚æ•°ä¸ºMediaQueryListå¯¹è±¡
       * - ***removeListener*** ç§»é™¤MediaQueryListå¯¹è±¡ç›‘å¬å™¨
       *
       * @example
       * $.matchMedia('screen and (orientation: portrait)').addListener(fn);
       */
      $.matchMedia = (function() {
          var mediaId = 0,
              cls = 'gmu-media-detect',
              transitionEnd = $.fx.transitionEnd,
              cssPrefix = $.fx.cssPrefix,
              $style = $('<style></style>').append('.' + cls + '{' + cssPrefix + 'transition: width 0.001ms; width: 0; position: relative; bottom: -999999px;}\n').appendTo('head');
  
          return function (query) {
              var id = cls + mediaId++,
                  $mediaElem = $('<div class="' + cls + '" id="' + id + '"></div>').appendTo('body'),
                  listeners = [],
                  ret;
  
              $style.append('@media ' + query + ' { #' + id + ' { width: 100px; } }\n') ;   //åŽŸç”ŸmatchMediaä¹Ÿéœ€è¦æ·»åŠ å¯¹åº”çš„@mediaæ‰èƒ½ç”Ÿæ•ˆ
              // if ('matchMedia' in window) {
              //     return window.matchMedia(query);
              // }
  
              $mediaElem.on(transitionEnd, function() {
                  ret.matches = $mediaElem.width() === 100;
                  $.each(listeners, function (i,fn) {
                      $.isFunction(fn) && fn.call(ret, ret);
                  });
              });
  
              ret = {
                  matches: $mediaElem.width() === 100 ,
                  media: query,
                  addListener: function (callback) {
                      listeners.push(callback);
                      return this;
                  },
                  removeListener: function (callback) {
                      var index = listeners.indexOf(callback);
                      ~index && listeners.splice(index, 1);
                      return this;
                  }
              };
  
              return ret;
          };
      }());
  
      $(function () {
          var handleOrtchange = function (mql) {
                  if ( state !== mql.matches ) {
                      $( window ).trigger( 'ortchange' );
                      state = mql.matches;
                  }
              },
              state = true;
          $.mediaQuery = {
              ortchange: 'screen and (width: ' + window.innerWidth + 'px)'
          };
          $.matchMedia($.mediaQuery.ortchange).addListener(handleOrtchange);
      });
  
      /**
       * @name Trigger Events
       * @theme event
       * @desc æ‰©å±•çš„äº‹ä»¶
       * - ***scrollStop*** : scrollåœä¸‹æ¥æ—¶è§¦å‘, è€ƒè™‘å‰è¿›æˆ–è€…åŽé€€åŽscrolläº‹ä»¶ä¸è§¦å‘æƒ…å†µã€‚
       * - ***ortchange*** : å½“è½¬å±çš„æ—¶å€™è§¦å‘ï¼Œå…¼å®¹ucå’Œå…¶ä»–ä¸æ”¯æŒorientationchangeçš„è®¾å¤‡ï¼Œåˆ©ç”¨css media queryå®žçŽ°ï¼Œè§£å†³äº†è½¬å±å»¶æ—¶åŠorientationäº‹ä»¶çš„å…¼å®¹æ€§é—®é¢˜
       * @example $(document).on('scrollStop', function () {        //scrollåœä¸‹æ¥æ—¶æ˜¾ç¤ºscrollStop
       *     console.log('scrollStop');
       * });
       *
       * $(window).on('ortchange', function () {        //å½“è½¬å±çš„æ—¶å€™è§¦å‘
       *     console.log('ortchange');
       * });
       */
      /** dispatch scrollStop */
      function _registerScrollStop(){
          $(window).on('scroll', $.debounce(80, function() {
              $(document).trigger('scrollStop');
          }, false));
      }
      //åœ¨ç¦»å¼€é¡µé¢ï¼Œå‰è¿›æˆ–åŽé€€å›žåˆ°é¡µé¢åŽï¼Œé‡æ–°ç»‘å®šscroll, éœ€è¦offæŽ‰æ‰€æœ‰çš„scrollï¼Œå¦åˆ™scrollæ—¶é—´ä¸è§¦å‘
      function _touchstartHander() {
          $(window).off('scroll');
          _registerScrollStop();
      }
      _registerScrollStop();
      $(window).on('pageshow', function(e){
          if(e.persisted) {//å¦‚æžœæ˜¯ä»Žbfcacheä¸­åŠ è½½é¡µé¢
              $(document).off('touchstart', _touchstartHander).one('touchstart', _touchstartHander);
          }
      });
  })(Zepto);
  
  
  /*************zpto-ui.js***************/
  
  /**
   * @file æ‰€æœ‰UIç»„ä»¶çš„åŸºç±»ï¼Œé€šè¿‡å®ƒå¯ä»¥ç®€å•çš„å¿«é€Ÿçš„åˆ›å»ºæ–°çš„ç»„ä»¶ã€‚
   * @name zepto.ui
   * @short zepto.ui
   * @desc æ‰€æœ‰UIç»„ä»¶çš„åŸºç±»ï¼Œé€šè¿‡å®ƒå¯ä»¥ç®€å•çš„å¿«é€Ÿçš„åˆ›å»ºæ–°çš„ç»„ä»¶ã€‚
   * @import core/zepto.js, core/zepto.extend.js
   */
  ;(function($, undefined) {
      var id = 1,
          _blankFn = function(){},
          tpl = '<%=name%>-<%=id%>',
          record = (function(){
              var data = {},
                  id = 0,
                  iKey = "GMUWidget"+(+ new Date()); //internal key.
  
              return function( obj, key, val){
                  var dkey = obj[ iKey ] || ( obj[ iKey ] = ++id ),
                      store = data[dkey] || (data[dkey] = {});
  
                  !$.isUndefined(val) && (store[key] = val);
                  $.isNull(val) && delete store[key];
  
                  return store[ key ];
              }
          })();
          
      $.ui = $.ui || {
          version: '2.0.5',
  
          guid: _guid,
  
          /**
           * @name $.ui.define
           * @grammar $.ui.define(name, data[, superClass]) â‡’ undefined
           * @desc å®šä¹‰ç»„ä»¶,
           * - ''name'' ç»„ä»¶åç§°
           * - ''data'' å¯¹è±¡ï¼Œè®¾ç½®æ­¤ç»„ä»¶çš„prototypeã€‚å¯ä»¥æ·»åŠ å±žæ€§æˆ–æ–¹æ³•
           * - ''superClass'' åŸºç±»ï¼ŒæŒ‡å®šæ­¤ç»„ä»¶åŸºäºŽå“ªä¸ªçŽ°æœ‰ç»„ä»¶ï¼Œé»˜è®¤ä¸ºWidgetåŸºç±»
           * **ç¤ºä¾‹:**
           * <code type="javascript">
           * $.ui.define('helloworld', {
           *     _data: {
           *         opt1: null
           *     },
           *     enable: function(){
           *         //...
           *     }
           * });
           * </code>
           *
           * **å®šä¹‰å®ŒåŽï¼Œå°±å¯ä»¥é€šè¿‡ä»¥ä¸‹æ–¹å¼ä½¿ç”¨äº†**
           *<code type="javascript">
           * var instance = $.ui.helloworld({opt1: true});
           * instance.enable();
           *
           * //æˆ–è€…
           * $('#id').helloworld({opt1:true});
           * //...later
           * $('#id').helloworld('enable');
           * </code>
           *
           * **Tips**
           * 1. é€šè¿‡Zeptoå¯¹è±¡ä¸Šçš„ç»„ä»¶æ–¹æ³•ï¼Œå¯ä»¥ç›´æŽ¥å®žä¾‹è¯ç»„ä»¶, å¦‚: $('#btn').button({label: 'abc'});
           * 2. é€šè¿‡Zeptoå¯¹è±¡ä¸Šçš„ç»„ä»¶æ–¹æ³•ï¼Œä¼ å…¥å­—ç¬¦ä¸²this, å¯ä»¥èŽ·å¾—ç»„ä»¶å®žä¾‹ï¼Œå¦‚ï¼švar btn = $('#btn').button('this');
           * 3. é€šè¿‡Zeptoå¯¹è±¡ä¸Šçš„ç»„ä»¶æ–¹æ³•ï¼Œå¯ä»¥ç›´æŽ¥è°ƒç”¨ç»„ä»¶æ–¹æ³•ï¼Œç¬¬ä¸€ä¸ªå‚æ•°ç”¨æ¥æŒ‡å®šæ–¹æ³•åï¼Œä¹‹åŽçš„å‚æ•°ä½œä¸ºæ–¹æ³•å‚æ•°ï¼Œå¦‚: $('#btn').button('setIcon', 'home');
           * 4. åœ¨å­ç±»ä¸­ï¼Œå¦‚è¦†å†™äº†æŸä¸ªæ–¹æ³•ï¼Œå¯ä»¥åœ¨æ–¹æ³•ä¸­é€šè¿‡this.$super()æ–¹æ³•è°ƒç”¨çˆ¶çº§æ–¹æ³•ã€‚å¦‚ï¼šthis.$super('enable');
           */
          define: function(name, data, superClass) {
              if(superClass) data.inherit = superClass;
              var Class = $.ui[name] = _createClass(function(el, options) {
                  var obj = _createObject(Class.prototype, {
                      _id: $.parseTpl(tpl, {
                          name: name,
                          id: _guid()
                      })
                  });
  
                  obj._createWidget.call(obj, el, options,Class.plugins);
                  return obj;
              }, data);
              return _zeptoLize(name, Class);
          },
  
          /**
           * @name $.ui.isWidget()
           * @grammar $.ui.isWidget(obj) â‡’ boolean
           * @grammar $.ui.isWidget(obj, name) â‡’ boolean
           * @desc åˆ¤æ–­objæ˜¯ä¸æ˜¯widgetå®žä¾‹
           *
           * **å‚æ•°**
           * - ''obj'' ç”¨äºŽæ£€æµ‹çš„å¯¹è±¡
           * - ''name'' å¯é€‰ï¼Œé»˜è®¤ç›‘æµ‹æ˜¯ä¸æ˜¯''widget''(åŸºç±»)çš„å®žä¾‹ï¼Œå¯ä»¥ä¼ å…¥ç»„ä»¶åå­—å¦‚''button''ã€‚ä½œç”¨å°†å˜ä¸ºobjæ˜¯ä¸æ˜¯buttonç»„ä»¶å®žä¾‹ã€‚
           * @param obj
           * @param name
           * @example
           *
           * var btn = $.ui.button(),
           *     dialog = $.ui.dialog();
           *
           * console.log($.isWidget(btn)); // => true
           * console.log($.isWidget(dialog)); // => true
           * console.log($.isWidget(btn, 'button')); // => true
           * console.log($.isWidget(dialog, 'button')); // => false
           * console.log($.isWidget(btn, 'noexist')); // => false
           */
          isWidget: function(obj, name){
              return obj instanceof (name===undefined ? _widget: $.ui[name] || _blankFn);
          }
      };
          
      /**
       * generate guid
       */
      function _guid() {
          return id++;
      };
  
      function _createObject(proto, data) {
          var obj = {};
          Object.create ? obj = Object.create(proto) : obj.__proto__ = proto;
          return $.extend(obj, data || {});
      }
  
      function _createClass(Class, data) {
          if (data) {
              _process(Class, data);
              $.extend(Class.prototype, data);
          }
          return $.extend(Class, {
              plugins: [],
              register: function(fn) {
                  if ($.isObject(fn)) {
                      $.extend(this.prototype,fn);
                      return;
                  }
                  this.plugins.push(fn);
              }
          });
      }
  
      /**
       * handle inherit & _data
       */
      function _process(Class, data) {
          var superClass = data.inherit || _widget,
              proto = superClass.prototype,
              obj;
          obj = Class.prototype = _createObject(proto, {
              $factory: Class,
              $super: function(key) {
                  var fn = proto[key];
                  return $.isFunction(fn) ? fn.apply(this, $.slice(arguments, 1)) : fn;
              }
          });
          obj._data = $.extend({}, proto._data, data._data);
          delete data._data;
          return Class;
      }
  
      /**
       * å¼ºåˆ¶setupæ¨¡å¼
       * @grammar $(selector).dialog(opts);
       */
      function _zeptoLize( name ) {
          $.fn[ name ] = function(opts) {
              var ret,
                  obj,
                  args = $.slice(arguments, 1);
  
              $.each( this, function( i, el ){
  
                  obj = record( el, name ) || $.ui[name]( el, $.extend( $.isPlainObject(opts) ? opts : {}, {
                      setup: true
                  } ) );
                  if ($.isString( opts )) {
                      if (!$.isFunction( obj[ opts ] ) && opts !== 'this') {
                          throw new Error(name + 'ç»„ä»¶æ²¡æœ‰æ­¤æ–¹æ³•');    //å½“ä¸æ˜¯å–æ–¹æ³•æ˜¯ï¼ŒæŠ›å‡ºé”™è¯¯ä¿¡æ¯
                      }
                      ret = $.isFunction( obj[ opts ] ) ? obj[opts].apply(obj, args) : undefined;
                  }
                  if( ret !== undefined && ret !== obj || opts === "this" && ( ret = obj ) ) {
                      return false;
                  }
                  ret = undefined;
              });
              //ret ä¸ºçœŸå°±æ˜¯è¦è¿”å›žuiå®žä¾‹ä¹‹å¤–çš„å†…å®¹
              //obj 'this'æ—¶è¿”å›ž
              //å…¶ä»–éƒ½æ˜¯è¿”å›žzeptoå®žä¾‹
              //ä¿®æ”¹è¿”å›žå€¼ä¸ºç©ºçš„æ—¶ï¼Œè¿”å›žå€¼ä¸å¯¹çš„é—®é¢˜
              return ret !== undefined ? ret : this;
          };
      }
      /**
       * @name widget
       * @desc GMUæ‰€æœ‰çš„ç»„ä»¶éƒ½æ˜¯æ­¤ç±»çš„å­ç±»ï¼Œå³ä»¥ä¸‹æ­¤ç±»é‡Œé¢çš„æ–¹æ³•éƒ½å¯åœ¨å…¶ä»–ç»„å»ºä¸­è°ƒç”¨ã€‚
       */
      var _widget = function() {};
      $.extend(_widget.prototype, {
          _data: {
              status: true
          },
  
          /**
           * @name data
           * @grammar data(key) â‡’ value
           * @grammar data(key, value) â‡’ value
           * @desc è®¾ç½®æˆ–è€…èŽ·å–options, æ‰€æœ‰ç»„ä»¶ä¸­çš„é…ç½®é¡¹éƒ½å¯ä»¥é€šè¿‡æ­¤æ–¹æ³•å¾—åˆ°ã€‚
           * @example
           * $('a#btn').button({label: 'æŒ‰é’®'});
           * console.log($('a#btn').button('data', 'label'));// => æŒ‰é’®
           */
          data: function(key, val) {
              var _data = this._data;
              if ($.isObject(key)) return $.extend(_data, key);
              else return !$.isUndefined(val) ? _data[key] = val : _data[key];
          },
  
          /**
           * common constructor
           */
          _createWidget: function(el, opts,plugins) {
  
              if ($.isObject(el)) {
                  opts = el || {};
                  el = undefined;
              }
  
              var data = $.extend({}, this._data, opts);
              $.extend(this, {
                  _el: el ? $(el) : undefined,
                  _data: data
              });
  
              //è§¦å‘plugins
              var me = this;
              $.each( plugins, function( i, fn ){
                  var result = fn.apply( me );
                  if(result && $.isPlainObject(result) ){
                      var plugins = me._data.disablePlugin;
                      if( !plugins || $.isString(plugins) && !~plugins.indexOf(result.pluginName) ){
                          delete result.pluginName;
                          $.each(result,function( key, val ){
                              var orgFn;
                              if((orgFn = me[key]) && $.isFunction( val ) ){
                                  me[key] = function(){
                                      me[key + 'Org'] = orgFn;
                                      return val.apply(me,arguments);
                                  }
                              }else
                                  me[key] = val;
                          });
                      }
                  }
              });
              // use setup or render
              if(data.setup) this._setup(el && el.getAttribute('data-mode'));
              else this._create();
              this._init();
  
              var me = this,
                  $el = this.trigger('init').root();
              $el.on('tap', function(e) {
                  (e['bubblesList'] || (e['bubblesList'] = [])).push(me);
              });
  
              record( $el[0], me._id.split('-')[0], me );
          },
  
          /**
           * @interface: use in render mod
           * @name _create
           * @desc æŽ¥å£å®šä¹‰ï¼Œå­ç±»ä¸­éœ€è¦é‡æ–°å®žçŽ°æ­¤æ–¹æ³•ï¼Œæ­¤æ–¹æ³•åœ¨renderæ¨¡å¼æ—¶è¢«è°ƒç”¨ã€‚
           *
           * æ‰€è°“çš„renderæ–¹å¼ï¼Œå³ï¼Œé€šè¿‡ä»¥ä¸‹æ–¹å¼åˆå§‹åŒ–ç»„ä»¶
           * <code>
           * $.ui.widgetName(options);
           * </code>
           */
          _create: function() {},
  
          /**
           * @interface: use in setup mod
           * @name _setup
           * @desc æŽ¥å£å®šä¹‰ï¼Œå­ç±»ä¸­éœ€è¦é‡æ–°å®žçŽ°æ­¤æ–¹æ³•ï¼Œæ­¤æ–¹æ³•åœ¨setupæ¨¡å¼æ—¶è¢«è°ƒç”¨ã€‚ç¬¬ä¸€ä¸ªè¡Œå‚ç”¨æ¥åˆ†è¾¨æ—¶fullsetupï¼Œè¿˜æ˜¯setup
           *
           * <code>
           * $.ui.define('helloworld', {
           *     _setup: function(mode){
           *          if(mode){
           *              //ä¸ºfullsetupæ¨¡å¼
           *          } else {
           *              //ä¸ºsetupæ¨¡å¼
           *          }
           *     }
           * });
           * </code>
           *
           * æ‰€è°“çš„setupæ–¹å¼ï¼Œå³ï¼Œå…ˆæœ‰domï¼Œç„¶åŽé€šè¿‡é€‰æ‹©å™¨ï¼Œåˆå§‹åŒ–ZeptoåŽï¼Œåœ¨Zeptoå¯¹è±¡ç›´æŽ¥è°ƒç”¨ç»„ä»¶åæ–¹æ³•å®žä¾‹åŒ–ç»„ä»¶ï¼Œå¦‚
           * <code>
           * //<div id="widget"></div>
           * $('#widget').widgetName(options);
           * </code>
           *
           * å¦‚æžœç”¨æ¥åˆå§‹åŒ–çš„elementï¼Œè®¾ç½®äº†data-mode="true"ï¼Œç»„ä»¶å°†ä»¥fullsetupæ¨¡å¼åˆå§‹åŒ–
           */
          _setup: function(mode) {},
  
          /**
           * @name root
           * @grammar root() â‡’ value
           * @grammar root(el) â‡’ value
           * @desc è®¾ç½®æˆ–è€…èŽ·å–æ ¹èŠ‚ç‚¹
           * @example
           * $('a#btn').button({label: 'æŒ‰é’®'});
           * console.log($('a#btn').button('root'));// => a#btn
           */
          root: function(el) {
              return this._el = el || this._el;
          },
  
          /**
           * @name id
           * @grammar id() â‡’ value
           * @grammar id(id) â‡’ value
           * @desc è®¾ç½®æˆ–è€…èŽ·å–ç»„ä»¶id
           */
          id: function(id) {
              return this._id = id || this._id;
          },
  
          /**
           * @name destroy
           * @grammar destroy() â‡’ undefined
           * @desc æ³¨é”€ç»„ä»¶
           */
          destroy: function() {
              var me = this,
                  $el;
              $el = this.trigger('destroy').off().root();
              $el.find('*').off();
              record( $el[0], me._id.split('-')[0], null);
              $el.off().remove();
              this.__proto__ = null;
              $.each(this, function(key) {
                  delete me[key];
              });
          },
  
          /**
           * @name on
           * @grammar on(type, handler) â‡’ instance
           * @desc ç»‘å®šäº‹ä»¶ï¼Œæ­¤äº‹ä»¶ç»‘å®šä¸åŒäºŽzeptoä¸Šç»‘å®šäº‹ä»¶ï¼Œæ­¤Onçš„thisåªæƒ³ç»„ä»¶å®žä¾‹ï¼Œè€Œéžzeptoå®žä¾‹
           */
          on: function(ev, callback) {
              this.root().on(ev, $.proxy(callback, this));
              return this;
          },
  
          /**
           * @name off
           * @grammar off(type) â‡’ instance
           * @grammar off(type, handler) â‡’ instance
           * @desc è§£ç»‘äº‹ä»¶
           */
          off: function(ev, callback) {
              this.root().off(ev, callback);
              return this;
          },
  
          /**
           * @name trigger
           * @grammar trigger(type[, data]) â‡’ instance
           * @desc è§¦å‘äº‹ä»¶, æ­¤triggerä¼šä¼˜å…ˆæŠŠoptionsä¸Šçš„äº‹ä»¶å›žè°ƒå‡½æ•°å…ˆæ‰§è¡Œï¼Œç„¶åŽç»™æ ¹DOMæ´¾é€äº‹ä»¶ã€‚
           * optionsä¸Šå›žè°ƒå‡½æ•°å¯ä»¥é€šè¿‡e.preventDefaualt()æ¥ç»„ç»‡äº‹ä»¶æ´¾å‘ã€‚
           */
          trigger: function(event, data) {
              event = $.isString(event) ? $.Event(event) : event;
              var onEvent = this.data(event.type),result;
              if( onEvent && $.isFunction(onEvent) ){
                  event.data = data;
                  result = onEvent.apply(this, [event].concat(data));
                  if(result === false || event.defaultPrevented){
                      return this;
                  }
              }
              this.root().trigger(event, data);
              return this;
          }
      });
  })(Zepto);
  
  
  
  /******************zpto-touch.js**********************/
  
  var tys_touch = 0;
  ;(function($){
    var touch = {},
      touchTimeout, tapTimeout, swipeTimeout, longTapTimeout,
      longTapDelay = 950,
      gesture
  
    function swipeDirection(x1, x2, y1, y2) {
      return Math.abs(x1 - x2) >=
        Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
    }
  
    function longTap() {
      longTapTimeout = null
      if (touch.last) {
        touch.el.trigger('longTap')
        touch = {}
      }
    }
  
    function cancelLongTap() {
      if (longTapTimeout) clearTimeout(longTapTimeout)
      longTapTimeout = null
    }
  
    function cancelAll() {
      if (touchTimeout) clearTimeout(touchTimeout)
      if (tapTimeout) clearTimeout(tapTimeout)
      if (swipeTimeout) clearTimeout(swipeTimeout)
      if (longTapTimeout) clearTimeout(longTapTimeout)
      touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
      touch = {}
    }
  
    function isPrimaryTouch(event){
      return (event.pointerType == 'touch' ||
        event.pointerType == event.MSPOINTER_TYPE_TOUCH)
        && event.isPrimary
    }
  
    function isPointerEventType(e, type){
      return (e.type == 'pointer'+type ||
        e.type.toLowerCase() == 'mspointer'+type)
    }
  
    $(document).ready(function(){
      var now, delta, deltaX = 0, deltaY = 0, firstTouch, _isPointerType
  
      if ('MSGesture' in window) {
        gesture = new MSGesture()
        gesture.target = document.body
      }
  
      $(document)
        .bind('MSGestureEnd', function(e){
          var swipeDirectionFromVelocity =
            e.velocityX > 1 ? 'Right' : e.velocityX < -1 ? 'Left' : e.velocityY > 1 ? 'Down' : e.velocityY < -1 ? 'Up' : null;
          if (swipeDirectionFromVelocity) {
            touch.el.trigger('swipe')
            touch.el.trigger('swipe'+ swipeDirectionFromVelocity)
          }
        })
        .on('touchstart MSPointerDown pointerdown', function(e){
          if((_isPointerType = isPointerEventType(e, 'down')) &&
            !isPrimaryTouch(e)) return
          firstTouch = _isPointerType ? e : e.touches[0]
          if (e.touches && e.touches.length === 1 && touch.x2) {
            // Clear out touch movement data if we have it sticking around
            // This can occur if touchcancel doesn't fire due to preventDefault, etc.
            touch.x2 = undefined
            touch.y2 = undefined
          }
          now = Date.now()
          delta = now - (touch.last || now)
          touch.el = $('tagName' in firstTouch.target ?
            firstTouch.target : firstTouch.target.parentNode)
          touchTimeout && clearTimeout(touchTimeout)
          touch.x1 = firstTouch.pageX
          touch.y1 = firstTouch.pageY
          if (delta > 0 && delta <= 250) touch.isDoubleTap = true
          touch.last = now
          longTapTimeout = setTimeout(longTap, longTapDelay)
          // adds the current touch contact for IE gesture recognition
          if (gesture && _isPointerType) gesture.addPointer(e.pointerId);
        })
        .on('touchmove MSPointerMove pointermove', function(e){
          if((_isPointerType = isPointerEventType(e, 'move')) &&
            !isPrimaryTouch(e)) return
          firstTouch = _isPointerType ? e : e.touches[0]
          cancelLongTap()
          touch.x2 = firstTouch.pageX
          touch.y2 = firstTouch.pageY
  
          deltaX += Math.abs(touch.x1 - touch.x2)
          deltaY += Math.abs(touch.y1 - touch.y2)
          tys_touch = touch.x1 - touch.x2;
        })
        .on('touchend MSPointerUp pointerup', function(e){
          if((_isPointerType = isPointerEventType(e, 'up')) &&
            !isPrimaryTouch(e)) return
          cancelLongTap()
  
          // swipe
          if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
              (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))
  
            swipeTimeout = setTimeout(function() {
              touch.el.trigger('swipe')
              touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
              touch = {}
            }, 0)
  
          // normal tap
          else if ('last' in touch)
            // don't fire tap when delta position changed by more than 30 pixels,
            // for instance when moving to a point and back to origin
            if (deltaX < 30 && deltaY < 30) {
              // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
              // ('tap' fires before 'scroll')
              tapTimeout = setTimeout(function() {
  
                // trigger universal 'tap' with the option to cancelTouch()
                // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
                var event = $.Event('tap')
                event.cancelTouch = cancelAll
                touch.el.trigger(event)
  
                // trigger double tap immediately
                if (touch.isDoubleTap) {
                  if (touch.el) touch.el.trigger('doubleTap')
                  touch = {}
                }
  
                // trigger single tap after 250ms of inactivity
                else {
                  touchTimeout = setTimeout(function(){
                    touchTimeout = null
                    if (touch.el) touch.el.trigger('singleTap')
                    touch = {}
                  }, 250)
                }
              }, 0)
            } else {
              touch = {}
            }
            deltaX = deltaY = 0
  
        })
        // when the browser window loses focus,
        // for example when a modal dialog is shown,
        // cancel all ongoing events
        .on('touchcancel MSPointerCancel pointercancel', cancelAll)
  
      // scrolling the window indicates intention of the user
      // to scroll, not tap or swipe, so cancel all ongoing events
      $(window).on('scroll', cancelAll)
    })
  
    ;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown',
      'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(eventName){
      $.fn[eventName] = function(callback){ return this.on(eventName, callback) }
    })
  })(Zepto)
  
  
  /********************zpto-event.js*********************/
  
  ;(function($){
    var _zid = 1, undefined,
        slice = Array.prototype.slice,
        isFunction = $.isFunction,
        isString = function(obj){ return typeof obj == 'string' },
        handlers = {},
        specialEvents={},
        focusinSupported = 'onfocusin' in window,
        focus = { focus: 'focusin', blur: 'focusout' },
        hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }
  
    specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'
  
    function zid(element) {
      return element._zid || (element._zid = _zid++)
    }
    function findHandlers(element, event, fn, selector) {
      event = parse(event)
      if (event.ns) var matcher = matcherFor(event.ns)
      return (handlers[zid(element)] || []).filter(function(handler) {
        return handler
          && (!event.e  || handler.e == event.e)
          && (!event.ns || matcher.test(handler.ns))
          && (!fn       || zid(handler.fn) === zid(fn))
          && (!selector || handler.sel == selector)
      })
    }
    function parse(event) {
      var parts = ('' + event).split('.')
      return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
    }
    function matcherFor(ns) {
      return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
    }
  
    function eventCapture(handler, captureSetting) {
      return handler.del &&
        (!focusinSupported && (handler.e in focus)) ||
        !!captureSetting
    }
  
    function realEvent(type) {
      return hover[type] || (focusinSupported && focus[type]) || type
    }
  
    function add(element, events, fn, data, selector, delegator, capture){
      var id = zid(element), set = (handlers[id] || (handlers[id] = []))
      events.split(/\s/).forEach(function(event){
        if (event == 'ready') return $(document).ready(fn)
        var handler   = parse(event)
        handler.fn    = fn
        handler.sel   = selector
        // emulate mouseenter, mouseleave
        if (handler.e in hover) fn = function(e){
          var related = e.relatedTarget
          if (!related || (related !== this && !$.contains(this, related)))
            return handler.fn.apply(this, arguments)
        }
        handler.del   = delegator
        var callback  = delegator || fn
        handler.proxy = function(e){
          e = compatible(e)
          if (e.isImmediatePropagationStopped()) return
          e.data = data
          var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
          if (result === false) e.preventDefault(), e.stopPropagation()
          return result
        }
        handler.i = set.length
        set.push(handler)
        if ('addEventListener' in element)
          element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    }
    function remove(element, events, fn, selector, capture){
      var id = zid(element)
      ;(events || '').split(/\s/).forEach(function(event){
        findHandlers(element, event, fn, selector).forEach(function(handler){
          delete handlers[id][handler.i]
        if ('removeEventListener' in element)
          element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
        })
      })
    }
  
    $.event = { add: add, remove: remove }
  
    $.proxy = function(fn, context) {
      var args = (2 in arguments) && slice.call(arguments, 2)
      if (isFunction(fn)) {
        var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) }
        proxyFn._zid = zid(fn)
        return proxyFn
      } else if (isString(context)) {
        if (args) {
          args.unshift(fn[context], fn)
          return $.proxy.apply(null, args)
        } else {
          return $.proxy(fn[context], fn)
        }
      } else {
        throw new TypeError("expected function")
      }
    }
  
    $.fn.bind = function(event, data, callback){
      return this.on(event, data, callback)
    }
    $.fn.unbind = function(event, callback){
      return this.off(event, callback)
    }
    $.fn.one = function(event, selector, data, callback){
      return this.on(event, selector, data, callback, 1)
    }
  
    var returnTrue = function(){return true},
        returnFalse = function(){return false},
        ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
        eventMethods = {
          preventDefault: 'isDefaultPrevented',
          stopImmediatePropagation: 'isImmediatePropagationStopped',
          stopPropagation: 'isPropagationStopped'
        }
  
    function compatible(event, source) {
      if (source || !event.isDefaultPrevented) {
        source || (source = event)
  
        $.each(eventMethods, function(name, predicate) {
          var sourceMethod = source[name]
          event[name] = function(){
            this[predicate] = returnTrue
            return sourceMethod && sourceMethod.apply(source, arguments)
          }
          event[predicate] = returnFalse
        })
  
        if (source.defaultPrevented !== undefined ? source.defaultPrevented :
            'returnValue' in source ? source.returnValue === false :
            source.getPreventDefault && source.getPreventDefault())
          event.isDefaultPrevented = returnTrue
      }
      return event
    }
  
    function createProxy(event) {
      var key, proxy = { originalEvent: event }
      for (key in event)
        if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]
  
      return compatible(proxy, event)
    }
  
    $.fn.delegate = function(selector, event, callback){
      return this.on(event, selector, callback)
    }
    $.fn.undelegate = function(selector, event, callback){
      return this.off(event, selector, callback)
    }
  
    $.fn.live = function(event, callback){
      $(document.body).delegate(this.selector, event, callback)
      return this
    }
    $.fn.die = function(event, callback){
      $(document.body).undelegate(this.selector, event, callback)
      return this
    }
  
    $.fn.on = function(event, selector, data, callback, one){
      var autoRemove, delegator, $this = this
      if (event && !isString(event)) {
        $.each(event, function(type, fn){
          $this.on(type, selector, data, fn, one)
        })
        return $this
      }
  
      if (!isString(selector) && !isFunction(callback) && callback !== false)
        callback = data, data = selector, selector = undefined
      if (isFunction(data) || data === false)
        callback = data, data = undefined
  
      if (callback === false) callback = returnFalse
  
      return $this.each(function(_, element){
        if (one) autoRemove = function(e){
          remove(element, e.type, callback)
          return callback.apply(this, arguments)
        }
  
        if (selector) delegator = function(e){
          var evt, match = $(e.target).closest(selector, element).get(0)
          if (match && match !== element) {
            evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
            return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
          }
        }
  
        add(element, event, callback, data, selector, delegator || autoRemove)
      })
    }
    $.fn.off = function(event, selector, callback){
      var $this = this
      if (event && !isString(event)) {
        $.each(event, function(type, fn){
          $this.off(type, selector, fn)
        })
        return $this
      }
  
      if (!isString(selector) && !isFunction(callback) && callback !== false)
        callback = selector, selector = undefined
  
      if (callback === false) callback = returnFalse
  
      return $this.each(function(){
        remove(this, event, callback, selector)
      })
    }
  
    $.fn.trigger = function(event, args){
      event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
      event._args = args
      return this.each(function(){
        // items in the collection might not be DOM elements
        if('dispatchEvent' in this) this.dispatchEvent(event)
        else $(this).triggerHandler(event, args)
      })
    }
  
    // triggers event handlers on current element just as if an event occurred,
    // doesn't trigger an actual event, doesn't bubble
    $.fn.triggerHandler = function(event, args){
      var e, result
      this.each(function(i, element){
        e = createProxy(isString(event) ? $.Event(event) : event)
        e._args = args
        e.target = element
        $.each(findHandlers(element, event.type || event), function(i, handler){
          result = handler.proxy(e)
          if (e.isImmediatePropagationStopped()) return false
        })
      })
      return result
    }
  
    // shortcut methods for `.bind(event, fn)` for each event type
    ;('focusin focusout load resize scroll unload click dblclick '+
    'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
    'change select keydown keypress keyup error').split(' ').forEach(function(event) {
      $.fn[event] = function(callback) {
        return callback ?
          this.bind(event, callback) :
          this.trigger(event)
      }
    })
  
    ;['focus', 'blur'].forEach(function(name) {
      $.fn[name] = function(callback) {
        if (callback) this.bind(name, callback)
        else this.each(function(){
          try { this[name]() }
          catch(e) {}
        })
        return this
      }
    })
  
    $.Event = function(type, props) {
      if (!isString(type)) props = type, type = props.type
      var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
      if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
      event.initEvent(type, bubbles, true)
      return compatible(event)
    }
  
  })(Zepto)
  
  
  
  /**************zpto-fx.js**********************/
  
  ;(function($, undefined){
    var prefix = '', eventPrefix, endEventName, endAnimationName,
      vendors = { Webkit: 'webkit', Moz: '', O: 'o' },
      document = window.document, testEl = document.createElement('div'),
      supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
      transform,
      transitionProperty, transitionDuration, transitionTiming, transitionDelay,
      animationName, animationDuration, animationTiming, animationDelay,
      cssReset = {}
  
    function dasherize(str) { return str.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase() }
    function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : name.toLowerCase() }
  
    $.each(vendors, function(vendor, event){
      if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
        prefix = '-' + vendor.toLowerCase() + '-'
        eventPrefix = event
        return false
      }
    })
  
    transform = prefix + 'transform'
    cssReset[transitionProperty = prefix + 'transition-property'] =
    cssReset[transitionDuration = prefix + 'transition-duration'] =
    cssReset[transitionDelay    = prefix + 'transition-delay'] =
    cssReset[transitionTiming   = prefix + 'transition-timing-function'] =
    cssReset[animationName      = prefix + 'animation-name'] =
    cssReset[animationDuration  = prefix + 'animation-duration'] =
    cssReset[animationDelay     = prefix + 'animation-delay'] =
    cssReset[animationTiming    = prefix + 'animation-timing-function'] = ''
  
    $.fx = {
      off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
      speeds: { _default: 300, fast: 200, slow: 400 },
      cssPrefix: prefix,
      transitionEnd: normalizeEvent('TransitionEnd'),
      animationEnd: normalizeEvent('AnimationEnd')
    }
  
    $.fn.animate = function(properties, duration, ease, callback, delay){
      if ($.isFunction(duration))
        callback = duration, ease = undefined, duration = undefined
      if ($.isFunction(ease))
        callback = ease, ease = undefined
      if ($.isPlainObject(duration))
        ease = duration.easing, callback = duration.complete, delay = duration.delay, duration = duration.duration
      if (duration) duration = (typeof duration == 'number' ? duration :
                      ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
      if (delay) delay = parseFloat(delay) / 1000
      return this.anim(properties, duration, ease, callback, delay)
    }
  
    $.fn.anim = function(properties, duration, ease, callback, delay){
      var key, cssValues = {}, cssProperties, transforms = '',
          that = this, wrappedCallback, endEvent = $.fx.transitionEnd,
          fired = false
  
      if (duration === undefined) duration = $.fx.speeds._default / 1000
      if (delay === undefined) delay = 0
      if ($.fx.off) duration = 0
  
      if (typeof properties == 'string') {
        // keyframe animation
        cssValues[animationName] = properties
        cssValues[animationDuration] = duration + 's'
        cssValues[animationDelay] = delay + 's'
        cssValues[animationTiming] = (ease || 'linear')
        endEvent = $.fx.animationEnd
      } else {
        cssProperties = []
        // CSS transitions
        for (key in properties)
          if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
          else cssValues[key] = properties[key], cssProperties.push(dasherize(key))
  
        if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
        if (duration > 0 && typeof properties === 'object') {
          cssValues[transitionProperty] = cssProperties.join(', ')
          cssValues[transitionDuration] = duration + 's'
          cssValues[transitionDelay] = delay + 's'
          cssValues[transitionTiming] = (ease || 'linear')
        }
      }
  
      wrappedCallback = function(event){
        if (typeof event !== 'undefined') {
          if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
          $(event.target).unbind(endEvent, wrappedCallback)
        } else
          $(this).unbind(endEvent, wrappedCallback) // triggered by setTimeout
  
        fired = true
        $(this).css(cssReset)
        callback && callback.call(this)
      }
      if (duration > 0){
        this.bind(endEvent, wrappedCallback)
        // transitionEnd is not always firing on older Android phones
        // so make sure it gets fired
        setTimeout(function(){
          if (fired) return
          wrappedCallback.call(that)
        }, (duration * 1000) + 25)
      }
  
      // trigger page reflow so new elements can animate
      this.size() && this.get(0).clientLeft
  
      this.css(cssValues)
  
      if (duration <= 0) setTimeout(function() {
        that.each(function(){ wrappedCallback.call(this) })
      }, 0)
  
      return this
    }
  
    testEl = null
  })(Zepto)