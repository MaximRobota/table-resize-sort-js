(function () {
    "use strict";
    function MouseHandler () {
    }
    MouseHandler.prototype = (function () {
		function getEvent(event) {
			return event || window.event;
		}
		function eventWhich(event) {
			return event.which || event.button;
		}
		function eventPageX(event) {
			var pageX = event.pageX;
			if (typeof pageX == 'undefined') {
				var body = document.body;
				var docElem = document.documentElement;
				pageX = event.clientX + (docElem && docElem.scrollLeft || body && body.scrollLeft || 0) - (docElem && docElem.clientLeft || body && body.clientLeft || 0);
			}
			return pageX;
		}
		function eventPageY(event) {
			var pageY = event.pageY;
			if (typeof pageY == 'undefined') {
				var body = document.body;
				var docElem = document.documentElement;
				pageY = event.clientY + (docElem && docElem.scrollTop || body && body.scrollTop || 0) - (docElem && docElem.clientTop || body && body.clientTop || 0);
			}
			return pageY;
		}
        function _mouseDown(event) {
           	event = getEvent(event);
            (this._mouseStarted && this._mouseUp(event));
            this._mouseDownEvent = event;
			if (!event.which) { // detect ie8
				var copy = {};
				for (var attr in event) {
					copy[attr] = event[attr];
				}
				this._mouseDownEvent = copy;
			}
            if (eventWhich(event) !== 1) {
                return true;
            }
            if (this.options.distance == 0) {
				this._mouseStarted = this._mousePrepareDrag(event) !== false;
				if (!this._mouseStarted) {					
					(event.preventDefault ? event.preventDefault() : (event.returnValue=false));
					(event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true));
					return true;
                }
            } else {
				this._mousePrepareClick(event);
			}
            var _this = this;
            this._mouseMoveDelegate = function (event) {
                return _this._mouseMove(event);
            };
            this._mouseUpDelegate = function (event) {
                return _this._mouseUp(event);
            };
            addEvent(document.body, 'mousemove', this._mouseMoveDelegate);
            addEvent(document.body, 'mouseup', this._mouseUpDelegate);
			(event.preventDefault ? event.preventDefault() : (event.returnValue=false));
			(event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true));
            return true;
		}
        function _mouseMove(event) {
            event = getEvent(event);
            if (!eventWhich(event)) {
                return this._mouseUp(event);
            }
            if (this._mouseStarted) {
                this._mouseDrag(event);
				(event.preventDefault ? event.preventDefault() : (event.returnValue=false));
				(event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true));
                return false;
            }
            if (this._mouseDistanceMet(event, this._mouseDownEvent)) {
                this._mouseStarted = (this._mousePrepareDrag(this._mouseDownEvent, event) !== false);
                (this._mouseStarted ? this._mouseDrag(event) : this._mouseUp(event));
            }
			(event.preventDefault ? event.preventDefault() : (event.returnValue=false));
			(event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true));
            return !this.mouseStarted;
		}
        function _mouseUp(event) {
            event = getEvent(event);
            removeEvent(document.body, 'mousemove', this._mouseMoveDelegate);
            removeEvent(document.body, 'mouseup', this._mouseUpDelegate);
            if (this._mouseStarted) {
                this._mouseStarted = false;
				this._mouseStopDrag(event);
            } else {
				this._mouseExecuteClick(event);
			}
			(event.preventDefault ? event.preventDefault() : (event.returnValue=false));
			(event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true));
            return false;
		}
        function _mouseDistanceMet(newEvent, lastEvent) {
			var x = Math.abs(eventPageX(lastEvent) - eventPageX(newEvent)),
				y = Math.abs(eventPageY(lastEvent) - eventPageY(newEvent));
			return (Math.sqrt(x*x + y*y)) >= this.options.distance;
		}
        function _mousePrepareClick() {}
		function _mousePrepareDrag() {}
        function _mouseDrag(event) {}
        function _mouseExecuteClick() {}
		function _mouseStopDrag() {}
		
		return {
			constructor: MouseHandler,
			options: {
                distance: 0
			},
			_mouseDown: _mouseDown,
			_mouseMove: _mouseMove,
			_mouseUp: _mouseUp,
			_mouseDistanceMet: _mouseDistanceMet,
			_mousePrepareClick: _mousePrepareClick,
			_mousePrepareDrag: _mousePrepareDrag,
			_mouseDrag: _mouseDrag,
			_mouseExecuteClick: _mouseExecuteClick,
			_mouseStopDrag: _mouseStopDrag
		};
	})();
    function ResizeHandler(table, options) {
		this.options.minWidth = 30;
		this.options.restoreState = true;
		this.options.fixed = false;
		var newOptions = {};
        for (var opt in this.options)
			newOptions[opt] = (typeof options[opt] == 'undefined') ?  this.options[opt] : options[opt];
		this.options = newOptions;
		this.table = table;
        this.hr = table.rows[0];
		this.nc = this.hr.cells.length;
        this.nr = table.rows.length;
		this._init();
    }
    (function () {
		ResizeHandler.prototype = new MouseHandler();
		ResizeHandler.prototype.constructor = ResizeHandler;
		function eventPageX(event) {
			var pageX = event.pageX;
			if (typeof pageX == 'undefined') {
				var body = document.body;
				var docElem = document.documentElement;
				pageX = event.clientX + (docElem && docElem.scrollLeft || body && body.scrollLeft || 0) - (docElem && docElem.clientLeft || body && body.clientLeft || 0);
			}
			return pageX;
		}
        function elementStyleProperty(element, prop) {
            if (window.getComputedStyle) {
                return window.getComputedStyle(element, "").getPropertyValue(prop);
            } else { // http://stackoverflow.com/questions/21797258/getcomputedstyle-like-javascript-function-for-ie8
                var re = /(\-([a-z]){1})/g;
                if (prop == 'float') prop = 'styleFloat';
                if (re.test(prop)) {
                    prop = prop.replace(re, function () {
                        return arguments[2].toUpperCase();
                    });
                }
                return element.currentStyle[prop]
            }
        }
		function numericProperty(prop) {
            return (typeof prop == 'undefined' || prop == '' || prop == null) ? 0 : parseInt(prop);
        }
		function eventTarget (event) {
			return event.target || event.srcElement;
		}
		function loadState(key) {
			var state = localStorage.getItem(key);

			if (state != null) {
				try {
					state = JSON.parse(state);
				} catch (e) {
					state = new Array();
				}
			} else {
				state = new Array();
			}
			return state;
		}
		function getIndex(state, searchId) {
			var index = state.findIndex(function (element, index, array) {
				var id = element.id;
				if (id != searchId) {
					return false;
				} else {
					return true;
				}
			});
			return index;
		}
		function saveState(key, table /* name, prop*/) {
			if (!localStorage) {
                console.log('localStorage not supported or not usable (i.e. ie in offline mode).');
				return; 
			}
			var state = loadState(key),
				id = table.getAttribute('id'),
				element = {id: id},
				index = getIndex(state, id);
				
			for (var i = 2; i < arguments.length; i+=2) {
				element[arguments[i]] = arguments[i+1];
			}
			if (index < 0) {
				state.push(element);
			} else {
				state.splice(index, 1, element);
			}
			localStorage.setItem(key, JSON.stringify(state));
		}
		function restoreState(key, table, name) {
			if (!localStorage) {
                console.log('localStorage not supported or not usable (i.e. ie in offline mode).');
				return; 
			}
			var state = loadState(key),
				id = table.getAttribute('id'),
				index = getIndex(state, id);
			if (index >= 0) {
				var element = state[index],
					memory = element[name],
					length = memory.length,
					nc = table.rows[0].cells.length;
				if (nc == length) {
					for (var i = 0; i < nc; i++) {
						var cell = table.rows[0].cells[i];
						cell.style.maxWidth = cell.style.width = memory[i];
					}
				}
			}			
		}
		ResizeHandler.prototype._init = function () {
            for (var i = 0; i < this.nc; i++) {
                var cell = this.hr.cells[i],
					width = elementStyleProperty(cell, 'width'),
					width = width == 'auto'?(cell.clientWidth-numericProperty(elementStyleProperty(cell, 'paddingLeft'))-numericProperty(elementStyleProperty(cell, 'paddingRight')))+'px':width; // ie8 support
                cell.style.width = width;
            }
			if (this.options.restoreState)
				restoreState('table-resize', this.table, 'resize');
		};		
		ResizeHandler.prototype._mousePrepareDrag = function (event) {
            this.ic = eventTarget(event).parentNode.parentNode.cellIndex;
            var initialColumn = this.ic,
				fixed = this.options.fixed,
				cell = [],
				width = [];
			for (var i = 0; i < 2; i++) {
				cell[i] = this.hr.cells[initialColumn+(i?fixed:i)];
				width[i] = numericProperty(cell[i].style.width);
			}
            for (var i = 0; i < this.nr; i++) {
				for (var j = 0; j <= fixed; j++) {
					cell = this.table.rows[i].cells[initialColumn+j];
					cell.style.maxWidth = cell.style.width = width[j] + 'px';
				}
            }
            this.cur = document.body.style.cursor;
            document.body.style.cursor = 'col-resize';
            return true;
		};
		ResizeHandler.prototype._mouseDrag = function (event) {
            var dist = eventPageX(event) - eventPageX(this._mouseDownEvent),
                initialColumn = this.ic,
				fixed = this.options.fixed,
				cell = [],
				width = [];
			for (var i = 0; i < 2; i++) {
				cell[i] = this.hr.cells[initialColumn+(i?fixed:i)];
				width[i] = numericProperty(cell[i].style.width);
			}
            if (width[0] <= -dist || width[1] <= dist) {
                this._mouseStopDrag(event);
            } else {
                var newWidth = [width[0] + dist, width[1] - dist];
                if (newWidth[0] > this.options.minWidth && newWidth[1] > this.options.minWidth) {

                    for (var i = 0; i < this.nr; i++) {
						for (var j = 0; j <= fixed; j++) {
							cell = this.table.rows[i].cells[initialColumn+j];
							cell.style.maxWidth = cell.style.width = newWidth[j] + 'px';
						}
                    }
					this._mouseDownEvent = event;
					if (!event.which) { // detect ie8
						var copy = {};
						for (var attr in event) {
							copy[attr] = event[attr];
						}
						this._mouseDownEvent = copy;
					}
                }
            }
		}
		ResizeHandler.prototype._mouseStopDrag = function () {
			var temp = new Array(this.nc);
            for (var i = 0; i < this.nc; i++) {
                var cell = this.hr.cells[i];
                temp[i] = cell.style.width;
            }
			if (this.options.restoreState)
				saveState('table-resize', this.table, 'resize', temp);
            document.body.style.cursor = this.cur;
		};
	})();

    function TableResize(table, options) {
        if (table && table.tagName !== 'TABLE') {
			console.log('ERROR: DOM element/input is not a table!');
            return;
        }
        if (!(table && table.rows && table.rows.length > 0)) {
			console.log('WARNING: Empty table.');
            return;
        }
		options = options || {};
        var resizeHandler = new ResizeHandler(table, options);
		var length = resizeHandler.hr.cells.length;
        for (var i = 0; i < ((options.fixed)?(length-1):length); i++) {
            var cell = resizeHandler.hr.cells[i];
            cell.innerHTML = '<div class=\"resize-base\"><div class=\"resize-elem\"></div><div class=\"resize-text\">' + cell.innerHTML + '</div></div>';
            addEvent(cell.childNodes[0].childNodes[0], 'mousedown', function (event) {
                resizeHandler._mouseDown(event);
            });
        }
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TableResize;
    } else {
        window.TableResize = TableResize;
    }
	if (!Array.prototype.findIndex) {
		try {
			Object.defineProperty(Array.prototype, 'findIndex', {
				enumerable: false,
				configurable: true,
				writable: true,
				value: function (predicate) {
					if (this == null) {
						throw new TypeError('Array.prototype.find called on null or undefined');
					}
					if (typeof predicate !== 'function') {
						throw new TypeError('predicate must be a function');
					}
					var list = Object(this);
					var length = list.length >>> 0;
					var thisArg = arguments[1];
					var value;

					for (var i = 0; i < length; i++) {
						if (i in list) {
							value = list[i];
							if (predicate.call(thisArg, value, i, list)) {
								return i;
							}
						}
					}
					return -1;
				}
			});
		} catch (e) { // ie8 support
			Array.prototype.findIndex = function(predicate) {
					if (this == null) {
						throw new TypeError('Array.prototype.find called on null or undefined');
					}
					if (typeof predicate !== 'function') {
						throw new TypeError('predicate must be a function');
					}
					var list = Object(this);
					var length = list.length >>> 0;
					var thisArg = arguments[1];
					var value;
					for (var i = 0; i < length; i++) {
						if (i in list) {
							value = list[i];
							if (predicate.call(thisArg, value, i, list)) {
								return i;
							}
						}
					}
					return -1;
			}
		}
	}
    function addEvent(obj, type, fn) {
        if (obj.attachEvent) {
            obj['e' + type + fn] = fn;
            obj[type + fn] = function () {
                obj['e' + type + fn](window.event);
            };
            obj.attachEvent('on' + type, obj[type + fn]);
        } else
            obj.addEventListener(type, fn, false);
    }
    function removeEvent(obj, type, fn) {
        if (obj.detachEvent) {
            obj.detachEvent('on' + type, obj[type + fn]);
            obj[type + fn] = null;
        } else
            obj.removeEventListener(type, fn, false);
    }
		  new TableResize(document.getElementById('example'), {distance: 0, minWidth: 60, restoreState: false, fixed: true});

})();


;(function() {
  function Tablesort(el, options) {
    if (!(this instanceof Tablesort)) return new Tablesort(el, options);

    if (!el || el.tagName !== 'TABLE') {
      throw new Error('Element must be a table');
    }
    this.init(el, options || {});
  }
  var sortOptions = [];
  var createEvent = function(name) {
    var evt;
    if (!window.CustomEvent || typeof window.CustomEvent !== 'function') {
      evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(name, false, false, undefined);
    } else {
      evt = new CustomEvent(name);
    }
    return evt;
  };
  var getInnerText = function(el) {
  	if(el.childNodes[0].value){
  		return el.childNodes[0].value;
  	}
    return el.getAttribute('data-sort') || el.textContent || el.innerText || '';
  };
  var caseInsensitiveSort = function(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();

    if (a === b) return 0;
    if (a < b) return 1;

    return -1;
  };
  var stabilize = function(sort, antiStabilize) {
    return function(a, b) {
      var unstableResult = sort(a.td, b.td);
      if (unstableResult === 0) {
        if (antiStabilize) return b.index - a.index;
        return a.index - b.index;
      }
      return unstableResult;
    };
  };

  Tablesort.extend = function(name, pattern, sort) {
    if (typeof pattern !== 'function' || typeof sort !== 'function') {
      throw new Error('Pattern and sort must be a function');
    }

    sortOptions.push({
      name: name,
      pattern: pattern,
      sort: sort
    });
  };

  Tablesort.prototype = {

    init: function(el, options) {
      var that = this,
          firstRow,
          defaultSort,
          i,
          cell;
      that.table = el;
      that.thead = false;
      that.options = options;
      if (el.rows && el.rows.length > 0) {
        if (el.tHead && el.tHead.rows.length > 0) {
          for (i = 0; i < el.tHead.rows.length; i++) {
            if (el.tHead.rows[i].getAttribute('data-sort-method') === 'thead') {
              firstRow = el.tHead.rows[i];
              break;
            }
          }
          if (!firstRow) {
            firstRow = el.tHead.rows[el.tHead.rows.length - 1];
          }
          that.thead = true;
        } else {
          firstRow = el.rows[0];
        }
      }
      if (!firstRow) return;
      var onClick = function() {
        if (that.current && that.current !== this) {
          that.current.removeAttribute('aria-sort');
        }
        that.current = this;
        that.sortTable(this);
      };
      for (i = 0; i < firstRow.cells.length; i++) {
        cell = firstRow.cells[i];
        cell.setAttribute('role','columnheader');
        if (cell.getAttribute('data-sort-method') !== 'none') {
          cell.tabindex = 0;
          cell.addEventListener('click', onClick, false);

          if (cell.getAttribute('data-sort-default') !== null) {
            defaultSort = cell;
          }
        }
      }
      if (defaultSort) {
        that.current = defaultSort;
        that.sortTable(defaultSort);
      }
    },
    sortTable: function(header, update) {
      var that = this,
          column = header.cellIndex,
          sortFunction = caseInsensitiveSort,
          item = '',
          items = [],
          i = that.thead ? 0 : 1,
          sortMethod = header.getAttribute('data-sort-method'),
          sortOrder = header.getAttribute('aria-sort');
      that.table.dispatchEvent(createEvent('beforeSort'));
      if (!update) {
        if (sortOrder === 'ascending') {
          sortOrder = 'descending';
        } else if (sortOrder === 'descending') {
          sortOrder = 'ascending';
        } else {
          sortOrder = that.options.descending ? 'ascending' : 'descending';
        }

        header.setAttribute('aria-sort', sortOrder);
      }
      if (that.table.rows.length < 2) return;
      if (!sortMethod) {
        while (items.length < 3 && i < that.table.tBodies[0].rows.length) {
          item = getInnerText(that.table.tBodies[0].rows[i].cells[column]);
          item = item.trim();
          if (item.length > 0) {
            items.push(item);
          }
          i++;
        }
        if (!items) return;
      }
      for (i = 0; i < sortOptions.length; i++) {
        item = sortOptions[i];

        if (sortMethod) {
          if (item.name === sortMethod) {
            sortFunction = item.sort;
            break;
          }
        } else if (items.every(item.pattern)) {
          sortFunction = item.sort;
          break;
        }
      }
      that.col = column;
      for (i = 0; i < that.table.tBodies.length; i++) {
        var newRows = [],
            noSorts = {},
            j,
            totalRows = 0,
            noSortsSoFar = 0;
        if (that.table.tBodies[i].rows.length < 2) continue;
        for (j = 0; j < that.table.tBodies[i].rows.length; j++) {
          item = that.table.tBodies[i].rows[j];
          if (item.getAttribute('data-sort-method') === 'none') {
            noSorts[totalRows] = item;
          } else {
            newRows.push({
              tr: item,
              td: getInnerText(item.cells[that.col]),
              index: totalRows
            });
          }
          totalRows++;
        }
        if (sortOrder === 'descending') {
          newRows.sort(stabilize(sortFunction, true));
          newRows.reverse();
        } else {
          newRows.sort(stabilize(sortFunction, false));
        }
        for (j = 0; j < totalRows; j++) {
          if (noSorts[j]) {
            item = noSorts[j];
            noSortsSoFar++;
          } else {
            item = newRows[j - noSortsSoFar].tr;
          }
          that.table.tBodies[i].appendChild(item);
        }
      }
      that.table.dispatchEvent(createEvent('afterSort'));
    },

    refresh: function() {
      if (this.current !== undefined) {
        this.sortTable(this.current, true);
      }
    }
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tablesort;
  } else {
    window.Tablesort = Tablesort;
  }
})();

(function(){
  var cleanNumber = function(i) {
    return i.replace(/[^\-?0-9.]/g, '');
  },
  compareNumber = function(a, b) {
    a = parseFloat(a);
    b = parseFloat(b);
    a = isNaN(a) ? 0 : a;
    b = isNaN(b) ? 0 : b;
    return a - b;
  };

  Tablesort.extend('number', function(item) {
    return item.match(/^[-+]?[£\x24Û¢´€]?\d+\s*([,\.]\d{0,2})/) || // Prefixed currency
      item.match(/^[-+]?\d+\s*([,\.]\d{0,2})?[£\x24Û¢´€]/) || // Suffixed currency
      item.match(/^[-+]?(\d)*-?([,\.]){0,1}-?(\d)+([E,e][\-+][\d]+)?%?$/); // Number
  }, function(a, b) {
    a = cleanNumber(a);
    b = cleanNumber(b);
    return compareNumber(b, a);
  });
}());

(function(){
  var compareNumber = function(a, b) {
    a = parseFloat(a);
    b = parseFloat(b);
    a = isNaN(a) ? 0 : a;
    b = isNaN(b) ? 0 : b;
    return a - b;
  },
  cleanNumber = function(i) {
    return i.replace(/[^\-?0-9.]/g, '');
  },
  suffix2num = function(suffix) {
    suffix = suffix.toLowerCase();
    var base = suffix[1] === 'i' ? 1024 : 1000;
    switch(suffix[0]) {
      case 'k':
        return Math.pow(base, 2);
      case 'm':
        return Math.pow(base, 3);
      case 'g':
        return Math.pow(base, 4);
      case 't':
        return Math.pow(base, 5);
      case 'p':
        return Math.pow(base, 6);
      case 'e':
        return Math.pow(base, 7);
      case 'z':
        return Math.pow(base, 8);
      case 'y':
        return Math.pow(base, 9);
      default:
        return base;
    }
  },
  filesize2num = function(filesize) {
    var matches = filesize.match(/^(\d+(\.\d+)?) ?((K|M|G|T|P|E|Z|Y|B$)i?B?)$/i);
    var num  = parseFloat(cleanNumber(matches[1])),
      suffix = matches[3];
    return num * suffix2num(suffix);
  };
  Tablesort.extend('filesize', function(item) {
    return /^\d+(\.\d+)? ?(K|M|G|T|P|E|Z|Y|B$)i?B?$/i.test(item);
  }, function(a, b) {
    a = filesize2num(a);
    b = filesize2num(b);
    return compareNumber(b, a);
  });
}());

(function(){
  Tablesort.extend('monthname', function(item) {
    return (
      item.search(/(January|February|March|April|May|June|July|August|September|October|November|December)/i) !== -1
    );
  }, function(a, b) {
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames.indexOf(b) - monthNames.indexOf(a);
  });
}());