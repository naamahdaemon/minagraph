(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r);
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (String )(t);
  }

  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }

  function _classCallCheck(a, n) {
    if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
  }

  function _defineProperties(e, r) {
    for (var t = 0; t < r.length; t++) {
      var o = r[t];
      o.enumerable = o.enumerable || false, o.configurable = true, "value" in o && (o.writable = true), Object.defineProperty(e, _toPropertyKey(o.key), o);
    }
  }
  function _createClass(e, r, t) {
    return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
      writable: false
    }), e;
  }

  function _getPrototypeOf(t) {
    return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
      return t.__proto__ || Object.getPrototypeOf(t);
    }, _getPrototypeOf(t);
  }

  function _isNativeReflectConstruct() {
    try {
      var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    } catch (t) {}
    return (_isNativeReflectConstruct = function () {
      return !!t;
    })();
  }

  function _assertThisInitialized(e) {
    if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return e;
  }

  function _possibleConstructorReturn(t, e) {
    if (e && ("object" == typeof e || "function" == typeof e)) return e;
    if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
    return _assertThisInitialized(t);
  }

  function _callSuper(t, o, e) {
    return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));
  }

  function _setPrototypeOf(t, e) {
    return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
      return t.__proto__ = e, t;
    }, _setPrototypeOf(t, e);
  }

  function _inherits(t, e) {
    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
    t.prototype = Object.create(e && e.prototype, {
      constructor: {
        value: t,
        writable: true,
        configurable: true
      }
    }), Object.defineProperty(t, "prototype", {
      writable: false
    }), e && _setPrototypeOf(t, e);
  }

  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
  }

  function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e,
        n,
        i,
        u,
        a = [],
        f = true,
        o = false;
      try {
        if (i = (t = t.call(r)).next, 0 === l) {
          if (Object(t) !== t) return;
          f = !1;
        } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
      } catch (r) {
        o = true, n = r;
      } finally {
        try {
          if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }

  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }

  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }

  var HTML_COLORS = {
    black: "#000000",
    silver: "#C0C0C0",
    gray: "#808080",
    grey: "#808080",
    white: "#FFFFFF",
    maroon: "#800000",
    red: "#FF0000",
    purple: "#800080",
    fuchsia: "#FF00FF",
    green: "#008000",
    lime: "#00FF00",
    olive: "#808000",
    yellow: "#FFFF00",
    navy: "#000080",
    blue: "#0000FF",
    teal: "#008080",
    aqua: "#00FFFF",
    darkblue: "#00008B",
    mediumblue: "#0000CD",
    darkgreen: "#006400",
    darkcyan: "#008B8B",
    deepskyblue: "#00BFFF",
    darkturquoise: "#00CED1",
    mediumspringgreen: "#00FA9A",
    springgreen: "#00FF7F",
    cyan: "#00FFFF",
    midnightblue: "#191970",
    dodgerblue: "#1E90FF",
    lightseagreen: "#20B2AA",
    forestgreen: "#228B22",
    seagreen: "#2E8B57",
    darkslategray: "#2F4F4F",
    darkslategrey: "#2F4F4F",
    limegreen: "#32CD32",
    mediumseagreen: "#3CB371",
    turquoise: "#40E0D0",
    royalblue: "#4169E1",
    steelblue: "#4682B4",
    darkslateblue: "#483D8B",
    mediumturquoise: "#48D1CC",
    indigo: "#4B0082",
    darkolivegreen: "#556B2F",
    cadetblue: "#5F9EA0",
    cornflowerblue: "#6495ED",
    rebeccapurple: "#663399",
    mediumaquamarine: "#66CDAA",
    dimgray: "#696969",
    dimgrey: "#696969",
    slateblue: "#6A5ACD",
    olivedrab: "#6B8E23",
    slategray: "#708090",
    slategrey: "#708090",
    lightslategray: "#778899",
    lightslategrey: "#778899",
    mediumslateblue: "#7B68EE",
    lawngreen: "#7CFC00",
    chartreuse: "#7FFF00",
    aquamarine: "#7FFFD4",
    skyblue: "#87CEEB",
    lightskyblue: "#87CEFA",
    blueviolet: "#8A2BE2",
    darkred: "#8B0000",
    darkmagenta: "#8B008B",
    saddlebrown: "#8B4513",
    darkseagreen: "#8FBC8F",
    lightgreen: "#90EE90",
    mediumpurple: "#9370DB",
    darkviolet: "#9400D3",
    palegreen: "#98FB98",
    darkorchid: "#9932CC",
    yellowgreen: "#9ACD32",
    sienna: "#A0522D",
    brown: "#A52A2A",
    darkgray: "#A9A9A9",
    darkgrey: "#A9A9A9",
    lightblue: "#ADD8E6",
    greenyellow: "#ADFF2F",
    paleturquoise: "#AFEEEE",
    lightsteelblue: "#B0C4DE",
    powderblue: "#B0E0E6",
    firebrick: "#B22222",
    darkgoldenrod: "#B8860B",
    mediumorchid: "#BA55D3",
    rosybrown: "#BC8F8F",
    darkkhaki: "#BDB76B",
    mediumvioletred: "#C71585",
    indianred: "#CD5C5C",
    peru: "#CD853F",
    chocolate: "#D2691E",
    tan: "#D2B48C",
    lightgray: "#D3D3D3",
    lightgrey: "#D3D3D3",
    thistle: "#D8BFD8",
    orchid: "#DA70D6",
    goldenrod: "#DAA520",
    palevioletred: "#DB7093",
    crimson: "#DC143C",
    gainsboro: "#DCDCDC",
    plum: "#DDA0DD",
    burlywood: "#DEB887",
    lightcyan: "#E0FFFF",
    lavender: "#E6E6FA",
    darksalmon: "#E9967A",
    violet: "#EE82EE",
    palegoldenrod: "#EEE8AA",
    lightcoral: "#F08080",
    khaki: "#F0E68C",
    aliceblue: "#F0F8FF",
    honeydew: "#F0FFF0",
    azure: "#F0FFFF",
    sandybrown: "#F4A460",
    wheat: "#F5DEB3",
    beige: "#F5F5DC",
    whitesmoke: "#F5F5F5",
    mintcream: "#F5FFFA",
    ghostwhite: "#F8F8FF",
    salmon: "#FA8072",
    antiquewhite: "#FAEBD7",
    linen: "#FAF0E6",
    lightgoldenrodyellow: "#FAFAD2",
    oldlace: "#FDF5E6",
    magenta: "#FF00FF",
    deeppink: "#FF1493",
    orangered: "#FF4500",
    tomato: "#FF6347",
    hotpink: "#FF69B4",
    coral: "#FF7F50",
    darkorange: "#FF8C00",
    lightsalmon: "#FFA07A",
    orange: "#FFA500",
    lightpink: "#FFB6C1",
    pink: "#FFC0CB",
    gold: "#FFD700",
    peachpuff: "#FFDAB9",
    navajowhite: "#FFDEAD",
    moccasin: "#FFE4B5",
    bisque: "#FFE4C4",
    mistyrose: "#FFE4E1",
    blanchedalmond: "#FFEBCD",
    papayawhip: "#FFEFD5",
    lavenderblush: "#FFF0F5",
    seashell: "#FFF5EE",
    cornsilk: "#FFF8DC",
    lemonchiffon: "#FFFACD",
    floralwhite: "#FFFAF0",
    snow: "#FFFAFA",
    lightyellow: "#FFFFE0",
    ivory: "#FFFFF0"
  };

  /**
   * Memoized function returning a float-encoded color from various string
   * formats describing colors.
   */
  var INT8 = new Int8Array(4);
  var INT32 = new Int32Array(INT8.buffer, 0, 1);
  var FLOAT32 = new Float32Array(INT8.buffer, 0, 1);
  var RGBA_TEST_REGEX = /^\s*rgba?\s*\(/;
  var RGBA_EXTRACT_REGEX = /^\s*rgba?\s*\(\s*([0-9]*)\s*,\s*([0-9]*)\s*,\s*([0-9]*)(?:\s*,\s*(.*)?)?\)\s*$/;
  function parseColor(val) {
    var r = 0; // byte
    var g = 0; // byte
    var b = 0; // byte
    var a = 1; // float

    // Handling hexadecimal notation
    if (val[0] === "#") {
      if (val.length === 4) {
        r = parseInt(val.charAt(1) + val.charAt(1), 16);
        g = parseInt(val.charAt(2) + val.charAt(2), 16);
        b = parseInt(val.charAt(3) + val.charAt(3), 16);
      } else {
        r = parseInt(val.charAt(1) + val.charAt(2), 16);
        g = parseInt(val.charAt(3) + val.charAt(4), 16);
        b = parseInt(val.charAt(5) + val.charAt(6), 16);
      }
      if (val.length === 9) {
        a = parseInt(val.charAt(7) + val.charAt(8), 16) / 255;
      }
    }

    // Handling rgb notation
    else if (RGBA_TEST_REGEX.test(val)) {
      var match = val.match(RGBA_EXTRACT_REGEX);
      if (match) {
        r = +match[1];
        g = +match[2];
        b = +match[3];
        if (match[4]) a = +match[4];
      }
    }
    return {
      r: r,
      g: g,
      b: b,
      a: a
    };
  }
  var FLOAT_COLOR_CACHE = {};
  for (var htmlColor in HTML_COLORS) {
    FLOAT_COLOR_CACHE[htmlColor] = floatColor(HTML_COLORS[htmlColor]);
    // Replicating cache for hex values for free
    FLOAT_COLOR_CACHE[HTML_COLORS[htmlColor]] = FLOAT_COLOR_CACHE[htmlColor];
  }
  function rgbaToFloat(r, g, b, a, masking) {
    INT32[0] = a << 24 | b << 16 | g << 8 | r;
    INT32[0] = INT32[0] & 0xfeffffff;
    return FLOAT32[0];
  }
  function floatColor(val) {
    // The html color names are case-insensitive
    val = val.toLowerCase();

    // If the color is already computed, we yield it
    if (typeof FLOAT_COLOR_CACHE[val] !== "undefined") return FLOAT_COLOR_CACHE[val];
    var parsed = parseColor(val);
    var r = parsed.r,
      g = parsed.g,
      b = parsed.b;
    var a = parsed.a;
    a = a * 255 | 0;
    var color = rgbaToFloat(r, g, b, a);
    FLOAT_COLOR_CACHE[val] = color;
    return color;
  }
  var FLOAT_INDEX_CACHE = {};
  function indexToColor(index) {
    // If the index is already computed, we yield it
    if (typeof FLOAT_INDEX_CACHE[index] !== "undefined") return FLOAT_INDEX_CACHE[index];

    // To address issue #1397, one strategy is to keep encoding 4 bytes colors,
    // but with alpha hard-set to 1.0 (or 255):
    var r = (index & 0x00ff0000) >>> 16;
    var g = (index & 0x0000ff00) >>> 8;
    var b = index & 0x000000ff;
    var a = 0x000000ff;

    // The original 4 bytes color encoding was the following:
    // const r = (index & 0xff000000) >>> 24;
    // const g = (index & 0x00ff0000) >>> 16;
    // const b = (index & 0x0000ff00) >>> 8;
    // const a = index & 0x000000ff;

    var color = rgbaToFloat(r, g, b, a);
    FLOAT_INDEX_CACHE[index] = color;
    return color;
  }
  function colorToIndex(r, g, b, _a) {
    // As for the function indexToColor, because of #1397 and the "alpha is always
    // 1.0" strategy, we need to fix this function as well:
    return b + (g << 8) + (r << 16);

    // The original 4 bytes color decoding is the following:
    // return a + (b << 8) + (g << 16) + (r << 24);
  }
  function getPixelColor(gl, frameBuffer, x, y, pixelRatio, downSizingRatio) {
    var bufferX = Math.floor(x / downSizingRatio * pixelRatio);
    var bufferY = Math.floor(gl.drawingBufferHeight / downSizingRatio - y / downSizingRatio * pixelRatio);
    var pixel = new Uint8Array(4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.readPixels(bufferX, bufferY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    var _pixel = _slicedToArray(pixel, 4),
      r = _pixel[0],
      g = _pixel[1],
      b = _pixel[2],
      a = _pixel[3];
    return [r, g, b, a];
  }

  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e[r] = t, e;
  }

  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), true).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }

  function _superPropBase(t, o) {
    for (; !{}.hasOwnProperty.call(t, o) && null !== (t = _getPrototypeOf(t)););
    return t;
  }

  function _get() {
    return _get = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function (e, t, r) {
      var p = _superPropBase(e, t);
      if (p) {
        var n = Object.getOwnPropertyDescriptor(p, t);
        return n.get ? n.get.call(arguments.length < 3 ? e : r) : n.value;
      }
    }, _get.apply(null, arguments);
  }

  function _superPropGet(t, o, e, r) {
    var p = _get(_getPrototypeOf(t.prototype ), o, e);
    return "function" == typeof p ? function (t) {
      return p.apply(e, t);
    } : p;
  }

  function getAttributeItemsCount(attr) {
    return attr.normalized ? 1 : attr.size;
  }
  function getAttributesItemsCount(attrs) {
    var res = 0;
    attrs.forEach(function (attr) {
      return res += getAttributeItemsCount(attr);
    });
    return res;
  }
  function loadShader(type, gl, source) {
    var glType = type === "VERTEX" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;

    // Creating the shader
    var shader = gl.createShader(glType);
    if (shader === null) {
      throw new Error("loadShader: error while creating the shader");
    }

    // Loading source
    gl.shaderSource(shader, source);

    // Compiling the shader
    gl.compileShader(shader);

    // Retrieving compilation status
    var successfullyCompiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    // Throwing if something went awry
    if (!successfullyCompiled) {
      var infoLog = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error("loadShader: error while compiling the shader:\n".concat(infoLog, "\n").concat(source));
    }
    return shader;
  }
  function loadVertexShader(gl, source) {
    return loadShader("VERTEX", gl, source);
  }
  function loadFragmentShader(gl, source) {
    return loadShader("FRAGMENT", gl, source);
  }

  /**
   * Function used to load a program.
   */
  function loadProgram(gl, shaders) {
    var program = gl.createProgram();
    if (program === null) {
      throw new Error("loadProgram: error while creating the program.");
    }
    var i, l;

    // Attaching the shaders
    for (i = 0, l = shaders.length; i < l; i++) gl.attachShader(program, shaders[i]);
    gl.linkProgram(program);

    // Checking status
    var successfullyLinked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!successfullyLinked) {
      gl.deleteProgram(program);
      throw new Error("loadProgram: error while linking the program.");
    }
    return program;
  }
  function killProgram(_ref) {
    var gl = _ref.gl,
      buffer = _ref.buffer,
      program = _ref.program,
      vertexShader = _ref.vertexShader,
      fragmentShader = _ref.fragmentShader;
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
  }

  var PICKING_PREFIX = "#define PICKING_MODE\n";
  var SIZE_FACTOR_PER_ATTRIBUTE_TYPE = _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, WebGL2RenderingContext.BOOL, 1), WebGL2RenderingContext.BYTE, 1), WebGL2RenderingContext.UNSIGNED_BYTE, 1), WebGL2RenderingContext.SHORT, 2), WebGL2RenderingContext.UNSIGNED_SHORT, 2), WebGL2RenderingContext.INT, 4), WebGL2RenderingContext.UNSIGNED_INT, 4), WebGL2RenderingContext.FLOAT, 4);
  var Program = /*#__PURE__*/function () {
    function Program(gl, pickingBuffer, renderer) {
      _classCallCheck(this, Program);
      // GLenum
      _defineProperty(this, "array", new Float32Array());
      _defineProperty(this, "constantArray", new Float32Array());
      _defineProperty(this, "capacity", 0);
      _defineProperty(this, "verticesCount", 0);
      // Reading and caching program definition
      var def = this.getDefinition();
      this.VERTICES = def.VERTICES;
      this.VERTEX_SHADER_SOURCE = def.VERTEX_SHADER_SOURCE;
      this.FRAGMENT_SHADER_SOURCE = def.FRAGMENT_SHADER_SOURCE;
      this.UNIFORMS = def.UNIFORMS;
      this.ATTRIBUTES = def.ATTRIBUTES;
      this.METHOD = def.METHOD;
      this.CONSTANT_ATTRIBUTES = "CONSTANT_ATTRIBUTES" in def ? def.CONSTANT_ATTRIBUTES : [];
      this.CONSTANT_DATA = "CONSTANT_DATA" in def ? def.CONSTANT_DATA : [];
      this.isInstanced = "CONSTANT_ATTRIBUTES" in def;

      // Computing stride
      this.ATTRIBUTES_ITEMS_COUNT = getAttributesItemsCount(this.ATTRIBUTES);
      this.STRIDE = this.VERTICES * this.ATTRIBUTES_ITEMS_COUNT;

      // Members
      this.renderer = renderer;
      this.normalProgram = this.getProgramInfo("normal", gl, def.VERTEX_SHADER_SOURCE, def.FRAGMENT_SHADER_SOURCE, null);
      this.pickProgram = pickingBuffer ? this.getProgramInfo("pick", gl, PICKING_PREFIX + def.VERTEX_SHADER_SOURCE, PICKING_PREFIX + def.FRAGMENT_SHADER_SOURCE, pickingBuffer) : null;

      // For instanced programs:
      if (this.isInstanced) {
        var constantAttributesItemsCount = getAttributesItemsCount(this.CONSTANT_ATTRIBUTES);
        if (this.CONSTANT_DATA.length !== this.VERTICES) throw new Error("Program: error while getting constant data (expected ".concat(this.VERTICES, " items, received ").concat(this.CONSTANT_DATA.length, " instead)"));
        this.constantArray = new Float32Array(this.CONSTANT_DATA.length * constantAttributesItemsCount);
        for (var i = 0; i < this.CONSTANT_DATA.length; i++) {
          var vector = this.CONSTANT_DATA[i];
          if (vector.length !== constantAttributesItemsCount) throw new Error("Program: error while getting constant data (one vector has ".concat(vector.length, " items instead of ").concat(constantAttributesItemsCount, ")"));
          for (var j = 0; j < vector.length; j++) this.constantArray[i * constantAttributesItemsCount + j] = vector[j];
        }
        this.STRIDE = this.ATTRIBUTES_ITEMS_COUNT;
      }
    }
    return _createClass(Program, [{
      key: "kill",
      value: function kill() {
        killProgram(this.normalProgram);
        if (this.pickProgram) {
          killProgram(this.pickProgram);
          this.pickProgram = null;
        }
      }
    }, {
      key: "getProgramInfo",
      value: function getProgramInfo(name, gl, vertexShaderSource, fragmentShaderSource, frameBuffer) {
        var def = this.getDefinition();

        // WebGL buffers
        var buffer = gl.createBuffer();
        if (buffer === null) throw new Error("Program: error while creating the WebGL buffer.");

        // Shaders and program
        var vertexShader = loadVertexShader(gl, vertexShaderSource);
        var fragmentShader = loadFragmentShader(gl, fragmentShaderSource);
        var program = loadProgram(gl, [vertexShader, fragmentShader]);

        // Initializing locations
        var uniformLocations = {};
        def.UNIFORMS.forEach(function (uniformName) {
          var location = gl.getUniformLocation(program, uniformName);
          if (location) uniformLocations[uniformName] = location;
        });
        var attributeLocations = {};
        def.ATTRIBUTES.forEach(function (attr) {
          attributeLocations[attr.name] = gl.getAttribLocation(program, attr.name);
        });

        // For instanced programs:
        var constantBuffer;
        if ("CONSTANT_ATTRIBUTES" in def) {
          def.CONSTANT_ATTRIBUTES.forEach(function (attr) {
            attributeLocations[attr.name] = gl.getAttribLocation(program, attr.name);
          });
          constantBuffer = gl.createBuffer();
          if (constantBuffer === null) throw new Error("Program: error while creating the WebGL constant buffer.");
        }
        return {
          name: name,
          program: program,
          gl: gl,
          frameBuffer: frameBuffer,
          buffer: buffer,
          constantBuffer: constantBuffer || {},
          uniformLocations: uniformLocations,
          attributeLocations: attributeLocations,
          isPicking: name === "pick",
          vertexShader: vertexShader,
          fragmentShader: fragmentShader
        };
      }
    }, {
      key: "bindProgram",
      value: function bindProgram(program) {
        var _this = this;
        var offset = 0;
        var gl = program.gl,
          buffer = program.buffer;
        if (!this.isInstanced) {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          offset = 0;
          this.ATTRIBUTES.forEach(function (attr) {
            return offset += _this.bindAttribute(attr, program, offset);
          });
          gl.bufferData(gl.ARRAY_BUFFER, this.array, gl.DYNAMIC_DRAW);
        } else {
          // Handle constant data (things that remain unchanged for all items):
          gl.bindBuffer(gl.ARRAY_BUFFER, program.constantBuffer);
          offset = 0;
          this.CONSTANT_ATTRIBUTES.forEach(function (attr) {
            return offset += _this.bindAttribute(attr, program, offset, false);
          });
          gl.bufferData(gl.ARRAY_BUFFER, this.constantArray, gl.STATIC_DRAW);

          // Handle "instance specific" data (things that vary for each item):
          gl.bindBuffer(gl.ARRAY_BUFFER, program.buffer);
          offset = 0;
          this.ATTRIBUTES.forEach(function (attr) {
            return offset += _this.bindAttribute(attr, program, offset, true);
          });
          gl.bufferData(gl.ARRAY_BUFFER, this.array, gl.DYNAMIC_DRAW);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
      }
    }, {
      key: "unbindProgram",
      value: function unbindProgram(program) {
        var _this2 = this;
        if (!this.isInstanced) {
          this.ATTRIBUTES.forEach(function (attr) {
            return _this2.unbindAttribute(attr, program);
          });
        } else {
          this.CONSTANT_ATTRIBUTES.forEach(function (attr) {
            return _this2.unbindAttribute(attr, program, false);
          });
          this.ATTRIBUTES.forEach(function (attr) {
            return _this2.unbindAttribute(attr, program, true);
          });
        }
      }
    }, {
      key: "bindAttribute",
      value: function bindAttribute(attr, program, offset, setDivisor) {
        var sizeFactor = SIZE_FACTOR_PER_ATTRIBUTE_TYPE[attr.type];
        if (typeof sizeFactor !== "number") throw new Error("Program.bind: yet unsupported attribute type \"".concat(attr.type, "\""));
        var location = program.attributeLocations[attr.name];
        var gl = program.gl;
        if (location !== -1) {
          gl.enableVertexAttribArray(location);
          var stride = !this.isInstanced ? this.ATTRIBUTES_ITEMS_COUNT * Float32Array.BYTES_PER_ELEMENT : (setDivisor ? this.ATTRIBUTES_ITEMS_COUNT : getAttributesItemsCount(this.CONSTANT_ATTRIBUTES)) * Float32Array.BYTES_PER_ELEMENT;
          gl.vertexAttribPointer(location, attr.size, attr.type, attr.normalized || false, stride, offset);
          if (this.isInstanced && setDivisor) {
            if (gl instanceof WebGL2RenderingContext) {
              gl.vertexAttribDivisor(location, 1);
            } else {
              var ext = gl.getExtension("ANGLE_instanced_arrays");
              if (ext) ext.vertexAttribDivisorANGLE(location, 1);
            }
          }
        }
        return attr.size * sizeFactor;
      }
    }, {
      key: "unbindAttribute",
      value: function unbindAttribute(attr, program, unsetDivisor) {
        var location = program.attributeLocations[attr.name];
        var gl = program.gl;
        if (location !== -1) {
          gl.disableVertexAttribArray(location);
          if (this.isInstanced && unsetDivisor) {
            if (gl instanceof WebGL2RenderingContext) {
              gl.vertexAttribDivisor(location, 0);
            } else {
              var ext = gl.getExtension("ANGLE_instanced_arrays");
              if (ext) ext.vertexAttribDivisorANGLE(location, 0);
            }
          }
        }
      }
    }, {
      key: "reallocate",
      value: function reallocate(capacity) {
        // If desired capacity has not changed we do nothing
        // NOTE: it's possible here to implement more subtle reallocation schemes
        // when the number of rendered items increase or decrease
        if (capacity === this.capacity) return;
        this.capacity = capacity;
        this.verticesCount = this.VERTICES * capacity;
        this.array = new Float32Array(!this.isInstanced ? this.verticesCount * this.ATTRIBUTES_ITEMS_COUNT : this.capacity * this.ATTRIBUTES_ITEMS_COUNT);
      }
    }, {
      key: "hasNothingToRender",
      value: function hasNothingToRender() {
        return this.verticesCount === 0;
      }
    }, {
      key: "renderProgram",
      value: function renderProgram(params, programInfo) {
        var gl = programInfo.gl,
          program = programInfo.program;

        // With the current fix for #1397, the alpha blending is enabled for the
        // picking layer:
        gl.enable(gl.BLEND);

        // Original code:
        // if (!isPicking) gl.enable(gl.BLEND);
        // else gl.disable(gl.BLEND);

        gl.useProgram(program);
        this.setUniforms(params, programInfo);
        this.drawWebGL(this.METHOD, programInfo);
      }
    }, {
      key: "render",
      value: function render(params) {
        if (this.hasNothingToRender()) return;
        if (this.pickProgram) {
          this.pickProgram.gl.viewport(0, 0, params.width * params.pixelRatio / params.downSizingRatio, params.height * params.pixelRatio / params.downSizingRatio);
          this.bindProgram(this.pickProgram);
          this.renderProgram(_objectSpread2(_objectSpread2({}, params), {}, {
            pixelRatio: params.pixelRatio / params.downSizingRatio
          }), this.pickProgram);
          this.unbindProgram(this.pickProgram);
        }
        this.normalProgram.gl.viewport(0, 0, params.width * params.pixelRatio, params.height * params.pixelRatio);
        this.bindProgram(this.normalProgram);
        this.renderProgram(params, this.normalProgram);
        this.unbindProgram(this.normalProgram);
      }
    }, {
      key: "drawWebGL",
      value: function drawWebGL(method, _ref) {
        var gl = _ref.gl,
          frameBuffer = _ref.frameBuffer;
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        if (!this.isInstanced) {
          gl.drawArrays(method, 0, this.verticesCount);
        } else {
          if (gl instanceof WebGL2RenderingContext) {
            gl.drawArraysInstanced(method, 0, this.VERTICES, this.capacity);
          } else {
            var ext = gl.getExtension("ANGLE_instanced_arrays");
            if (ext) ext.drawArraysInstancedANGLE(method, 0, this.VERTICES, this.capacity);
          }
        }
      }
    }]);
  }();
  var NodeProgram = /*#__PURE__*/function (_ref) {
    function NodeProgram() {
      _classCallCheck(this, NodeProgram);
      return _callSuper(this, NodeProgram, arguments);
    }
    _inherits(NodeProgram, _ref);
    return _createClass(NodeProgram, [{
      key: "kill",
      value: function kill() {
        _superPropGet(NodeProgram, "kill", this)([]);
      }
    }, {
      key: "process",
      value: function process(nodeIndex, offset, data) {
        var i = offset * this.STRIDE;
        // NOTE: dealing with hidden items automatically
        if (data.hidden) {
          for (var l = i + this.STRIDE; i < l; i++) {
            this.array[i] = 0;
          }
          return;
        }
        return this.processVisibleItem(indexToColor(nodeIndex), i, data);
      }
    }]);
  }(Program);
  var EdgeProgram = /*#__PURE__*/function (_ref) {
    function EdgeProgram() {
      var _this;
      _classCallCheck(this, EdgeProgram);
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _callSuper(this, EdgeProgram, [].concat(args));
      _defineProperty(_this, "drawLabel", undefined);
      return _this;
    }
    _inherits(EdgeProgram, _ref);
    return _createClass(EdgeProgram, [{
      key: "kill",
      value: function kill() {
        _superPropGet(EdgeProgram, "kill", this)([]);
      }
    }, {
      key: "process",
      value: function process(edgeIndex, offset, sourceData, targetData, data) {
        var i = offset * this.STRIDE;
        // NOTE: dealing with hidden items automatically
        if (data.hidden || sourceData.hidden || targetData.hidden) {
          for (var l = i + this.STRIDE; i < l; i++) {
            this.array[i] = 0;
          }
          return;
        }
        return this.processVisibleItem(indexToColor(edgeIndex), i, sourceData, targetData, data);
      }
    }]);
  }(Program);
  /**
   * Helper function combining two or more programs into a single compound one.
   * Note that this is more a quick & easy way to combine program than a really
   * performant option. More performant programs can be written entirely.
   *
   * @param  {array}    programClasses - Program classes to combine.
   * @param  {function} drawLabel - An optional edge "draw label" function.
   * @return {function}
   */
  function createEdgeCompoundProgram(programClasses, drawLabel) {
    return /*#__PURE__*/function () {
      function EdgeCompoundProgram(gl, pickingBuffer, renderer) {
        _classCallCheck(this, EdgeCompoundProgram);
        _defineProperty(this, "drawLabel", drawLabel);
        this.programs = programClasses.map(function (Program) {
          return new Program(gl, pickingBuffer, renderer);
        });
      }
      return _createClass(EdgeCompoundProgram, [{
        key: "reallocate",
        value: function reallocate(capacity) {
          this.programs.forEach(function (program) {
            return program.reallocate(capacity);
          });
        }
      }, {
        key: "process",
        value: function process(edgeIndex, offset, sourceData, targetData, data) {
          this.programs.forEach(function (program) {
            return program.process(edgeIndex, offset, sourceData, targetData, data);
          });
        }
      }, {
        key: "render",
        value: function render(params) {
          this.programs.forEach(function (program) {
            return program.render(params);
          });
        }
      }, {
        key: "kill",
        value: function kill() {
          this.programs.forEach(function (program) {
            return program.kill();
          });
        }
      }]);
    }();
  }

  function drawStraightEdgeLabel(context, edgeData, sourceData, targetData, settings) {
    var size = settings.edgeLabelSize,
      font = settings.edgeLabelFont,
      weight = settings.edgeLabelWeight,
      color = settings.edgeLabelColor.attribute ? edgeData[settings.edgeLabelColor.attribute] || settings.edgeLabelColor.color || "#000" : settings.edgeLabelColor.color;
    var label = edgeData.label;
    if (!label) return;
    context.fillStyle = color;
    context.font = "".concat(weight, " ").concat(size, "px ").concat(font);

    // Computing positions without considering nodes sizes:
    var sSize = sourceData.size;
    var tSize = targetData.size;
    var sx = sourceData.x;
    var sy = sourceData.y;
    var tx = targetData.x;
    var ty = targetData.y;
    var cx = (sx + tx) / 2;
    var cy = (sy + ty) / 2;
    var dx = tx - sx;
    var dy = ty - sy;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < sSize + tSize) return;

    // Adding nodes sizes:
    sx += dx * sSize / d;
    sy += dy * sSize / d;
    tx -= dx * tSize / d;
    ty -= dy * tSize / d;
    cx = (sx + tx) / 2;
    cy = (sy + ty) / 2;
    dx = tx - sx;
    dy = ty - sy;
    d = Math.sqrt(dx * dx + dy * dy);

    // Handling ellipsis
    var textLength = context.measureText(label).width;
    if (textLength > d) {
      var ellipsis = "…";
      label = label + ellipsis;
      textLength = context.measureText(label).width;
      while (textLength > d && label.length > 1) {
        label = label.slice(0, -2) + ellipsis;
        textLength = context.measureText(label).width;
      }
      if (label.length < 4) return;
    }
    var angle;
    if (dx > 0) {
      if (dy > 0) angle = Math.acos(dx / d);else angle = Math.asin(dy / d);
    } else {
      if (dy > 0) angle = Math.acos(dx / d) + Math.PI;else angle = Math.asin(dx / d) + Math.PI / 2;
    }
    context.save();
    context.translate(cx, cy);
    context.rotate(angle);
    context.fillText(label, -textLength / 2, edgeData.size / 2 + size);
    context.restore();
  }

  function drawDiscNodeLabel(context, data, settings) {
    if (!data.label) return;
    var size = settings.labelSize,
      font = settings.labelFont,
      weight = settings.labelWeight,
      color = settings.labelColor.attribute ? data[settings.labelColor.attribute] || settings.labelColor.color || "#000" : settings.labelColor.color;
    context.fillStyle = color;
    context.font = "".concat(weight, " ").concat(size, "px ").concat(font);
    context.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
  }

  /**
   * Draw an hovered node.
   * - if there is no label => display a shadow on the node
   * - if the label box is bigger than node size => display a label box that contains the node with a shadow
   * - else node with shadow and the label box
   */
  function drawDiscNodeHover(context, data, settings) {
    var size = settings.labelSize,
      font = settings.labelFont,
      weight = settings.labelWeight;
    context.font = "".concat(weight, " ").concat(size, "px ").concat(font);

    // Then we draw the label background
    context.fillStyle = "#FFF";
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 8;
    context.shadowColor = "#000";
    var PADDING = 2;
    if (typeof data.label === "string") {
      var textWidth = context.measureText(data.label).width,
        boxWidth = Math.round(textWidth + 5),
        boxHeight = Math.round(size + 2 * PADDING),
        radius = Math.max(data.size, size / 2) + PADDING;
      var angleRadian = Math.asin(boxHeight / 2 / radius);
      var xDeltaCoord = Math.sqrt(Math.abs(Math.pow(radius, 2) - Math.pow(boxHeight / 2, 2)));
      context.beginPath();
      context.moveTo(data.x + xDeltaCoord, data.y + boxHeight / 2);
      context.lineTo(data.x + radius + boxWidth, data.y + boxHeight / 2);
      context.lineTo(data.x + radius + boxWidth, data.y - boxHeight / 2);
      context.lineTo(data.x + xDeltaCoord, data.y - boxHeight / 2);
      context.arc(data.x, data.y, radius, angleRadian, -angleRadian);
      context.closePath();
      context.fill();
    } else {
      context.beginPath();
      context.arc(data.x, data.y, data.size + PADDING, 0, Math.PI * 2);
      context.closePath();
      context.fill();
    }
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 0;

    // And finally we draw the label
    drawDiscNodeLabel(context, data, settings);
  }

  // language=GLSL
  var SHADER_SOURCE$6 = /*glsl*/"\nprecision highp float;\n\nvarying vec4 v_color;\nvarying vec2 v_diffVector;\nvarying float v_radius;\n\nuniform float u_correctionRatio;\n\nconst vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);\n\nvoid main(void) {\n  float border = u_correctionRatio * 2.0;\n  float dist = length(v_diffVector) - v_radius + border;\n\n  // No antialiasing for picking mode:\n  #ifdef PICKING_MODE\n  if (dist > border)\n    gl_FragColor = transparent;\n  else\n    gl_FragColor = v_color;\n\n  #else\n  float t = 0.0;\n  if (dist > border)\n    t = 1.0;\n  else if (dist > 0.0)\n    t = dist / border;\n\n  gl_FragColor = mix(v_color, transparent, t);\n  #endif\n}\n";
  var FRAGMENT_SHADER_SOURCE$2 = SHADER_SOURCE$6;

  // language=GLSL
  var SHADER_SOURCE$5 = /*glsl*/"\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_position;\nattribute float a_size;\nattribute float a_angle;\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_correctionRatio;\n\nvarying vec4 v_color;\nvarying vec2 v_diffVector;\nvarying float v_radius;\nvarying float v_border;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float size = a_size * u_correctionRatio / u_sizeRatio * 4.0;\n  vec2 diffVector = size * vec2(cos(a_angle), sin(a_angle));\n  vec2 position = a_position + diffVector;\n  gl_Position = vec4(\n    (u_matrix * vec3(position, 1)).xy,\n    0,\n    1\n  );\n\n  v_diffVector = diffVector;\n  v_radius = size / 2.0;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n";
  var VERTEX_SHADER_SOURCE$3 = SHADER_SOURCE$5;

  var _WebGLRenderingContex$3 = WebGLRenderingContext,
    UNSIGNED_BYTE$3 = _WebGLRenderingContex$3.UNSIGNED_BYTE,
    FLOAT$3 = _WebGLRenderingContex$3.FLOAT;
  var UNIFORMS$3 = ["u_sizeRatio", "u_correctionRatio", "u_matrix"];
  var NodeCircleProgram = /*#__PURE__*/function (_NodeProgram) {
    function NodeCircleProgram() {
      _classCallCheck(this, NodeCircleProgram);
      return _callSuper(this, NodeCircleProgram, arguments);
    }
    _inherits(NodeCircleProgram, _NodeProgram);
    return _createClass(NodeCircleProgram, [{
      key: "getDefinition",
      value: function getDefinition() {
        return {
          VERTICES: 3,
          VERTEX_SHADER_SOURCE: VERTEX_SHADER_SOURCE$3,
          FRAGMENT_SHADER_SOURCE: FRAGMENT_SHADER_SOURCE$2,
          METHOD: WebGLRenderingContext.TRIANGLES,
          UNIFORMS: UNIFORMS$3,
          ATTRIBUTES: [{
            name: "a_position",
            size: 2,
            type: FLOAT$3
          }, {
            name: "a_size",
            size: 1,
            type: FLOAT$3
          }, {
            name: "a_color",
            size: 4,
            type: UNSIGNED_BYTE$3,
            normalized: true
          }, {
            name: "a_id",
            size: 4,
            type: UNSIGNED_BYTE$3,
            normalized: true
          }],
          CONSTANT_ATTRIBUTES: [{
            name: "a_angle",
            size: 1,
            type: FLOAT$3
          }],
          CONSTANT_DATA: [[NodeCircleProgram.ANGLE_1], [NodeCircleProgram.ANGLE_2], [NodeCircleProgram.ANGLE_3]]
        };
      }
    }, {
      key: "processVisibleItem",
      value: function processVisibleItem(nodeIndex, startIndex, data) {
        var array = this.array;
        var color = floatColor(data.color);
        array[startIndex++] = data.x;
        array[startIndex++] = data.y;
        array[startIndex++] = data.size;
        array[startIndex++] = color;
        array[startIndex++] = nodeIndex;
      }
    }, {
      key: "setUniforms",
      value: function setUniforms(params, _ref) {
        var gl = _ref.gl,
          uniformLocations = _ref.uniformLocations;
        var u_sizeRatio = uniformLocations.u_sizeRatio,
          u_correctionRatio = uniformLocations.u_correctionRatio,
          u_matrix = uniformLocations.u_matrix;
        gl.uniform1f(u_correctionRatio, params.correctionRatio);
        gl.uniform1f(u_sizeRatio, params.sizeRatio);
        gl.uniformMatrix3fv(u_matrix, false, params.matrix);
      }
    }]);
  }(NodeProgram);
  _defineProperty(NodeCircleProgram, "ANGLE_1", 0);
  _defineProperty(NodeCircleProgram, "ANGLE_2", 2 * Math.PI / 3);
  _defineProperty(NodeCircleProgram, "ANGLE_3", 4 * Math.PI / 3);

  // language=GLSL
  var SHADER_SOURCE$4 = /*glsl*/"\nprecision mediump float;\n\nvarying vec4 v_color;\n\nvoid main(void) {\n  gl_FragColor = v_color;\n}\n";
  var FRAGMENT_SHADER_SOURCE$1 = SHADER_SOURCE$4;

  // language=GLSL
  var SHADER_SOURCE$3 = /*glsl*/"\nattribute vec2 a_position;\nattribute vec2 a_normal;\nattribute float a_radius;\nattribute vec3 a_barycentric;\n\n#ifdef PICKING_MODE\nattribute vec4 a_id;\n#else\nattribute vec4 a_color;\n#endif\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_correctionRatio;\nuniform float u_minEdgeThickness;\nuniform float u_lengthToThicknessRatio;\nuniform float u_widenessToThicknessRatio;\n\nvarying vec4 v_color;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float minThickness = u_minEdgeThickness;\n\n  float normalLength = length(a_normal);\n  vec2 unitNormal = a_normal / normalLength;\n\n  // These first computations are taken from edge.vert.glsl and\n  // edge.clamped.vert.glsl. Please read it to get better comments on what's\n  // happening:\n  float pixelsThickness = max(normalLength / u_sizeRatio, minThickness);\n  float webGLThickness = pixelsThickness * u_correctionRatio;\n  float webGLNodeRadius = a_radius * 2.0 * u_correctionRatio / u_sizeRatio;\n  float webGLArrowHeadLength = webGLThickness * u_lengthToThicknessRatio * 2.0;\n  float webGLArrowHeadThickness = webGLThickness * u_widenessToThicknessRatio;\n\n  float da = a_barycentric.x;\n  float db = a_barycentric.y;\n  float dc = a_barycentric.z;\n\n  vec2 delta = vec2(\n      da * (webGLNodeRadius * unitNormal.y)\n    + db * ((webGLNodeRadius + webGLArrowHeadLength) * unitNormal.y + webGLArrowHeadThickness * unitNormal.x)\n    + dc * ((webGLNodeRadius + webGLArrowHeadLength) * unitNormal.y - webGLArrowHeadThickness * unitNormal.x),\n\n      da * (-webGLNodeRadius * unitNormal.x)\n    + db * (-(webGLNodeRadius + webGLArrowHeadLength) * unitNormal.x + webGLArrowHeadThickness * unitNormal.y)\n    + dc * (-(webGLNodeRadius + webGLArrowHeadLength) * unitNormal.x - webGLArrowHeadThickness * unitNormal.y)\n  );\n\n  vec2 position = (u_matrix * vec3(a_position + delta, 1)).xy;\n\n  gl_Position = vec4(position, 0, 1);\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n";
  var VERTEX_SHADER_SOURCE$2 = SHADER_SOURCE$3;

  var _WebGLRenderingContex$2 = WebGLRenderingContext,
    UNSIGNED_BYTE$2 = _WebGLRenderingContex$2.UNSIGNED_BYTE,
    FLOAT$2 = _WebGLRenderingContex$2.FLOAT;
  var UNIFORMS$2 = ["u_matrix", "u_sizeRatio", "u_correctionRatio", "u_minEdgeThickness", "u_lengthToThicknessRatio", "u_widenessToThicknessRatio"];
  var DEFAULT_EDGE_ARROW_HEAD_PROGRAM_OPTIONS = {
    extremity: "target",
    lengthToThicknessRatio: 2.5,
    widenessToThicknessRatio: 2
  };
  function createEdgeArrowHeadProgram(inputOptions) {
    var options = _objectSpread2(_objectSpread2({}, DEFAULT_EDGE_ARROW_HEAD_PROGRAM_OPTIONS), {});
    return /*#__PURE__*/function (_EdgeProgram) {
      function EdgeArrowHeadProgram() {
        _classCallCheck(this, EdgeArrowHeadProgram);
        return _callSuper(this, EdgeArrowHeadProgram, arguments);
      }
      _inherits(EdgeArrowHeadProgram, _EdgeProgram);
      return _createClass(EdgeArrowHeadProgram, [{
        key: "getDefinition",
        value: function getDefinition() {
          return {
            VERTICES: 3,
            VERTEX_SHADER_SOURCE: VERTEX_SHADER_SOURCE$2,
            FRAGMENT_SHADER_SOURCE: FRAGMENT_SHADER_SOURCE$1,
            METHOD: WebGLRenderingContext.TRIANGLES,
            UNIFORMS: UNIFORMS$2,
            ATTRIBUTES: [{
              name: "a_position",
              size: 2,
              type: FLOAT$2
            }, {
              name: "a_normal",
              size: 2,
              type: FLOAT$2
            }, {
              name: "a_radius",
              size: 1,
              type: FLOAT$2
            }, {
              name: "a_color",
              size: 4,
              type: UNSIGNED_BYTE$2,
              normalized: true
            }, {
              name: "a_id",
              size: 4,
              type: UNSIGNED_BYTE$2,
              normalized: true
            }],
            CONSTANT_ATTRIBUTES: [{
              name: "a_barycentric",
              size: 3,
              type: FLOAT$2
            }],
            CONSTANT_DATA: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
          };
        }
      }, {
        key: "processVisibleItem",
        value: function processVisibleItem(edgeIndex, startIndex, sourceData, targetData, data) {
          if (options.extremity === "source") {
            var _ref = [targetData, sourceData];
            sourceData = _ref[0];
            targetData = _ref[1];
          }
          var thickness = data.size || 1;
          var radius = targetData.size || 1;
          var x1 = sourceData.x;
          var y1 = sourceData.y;
          var x2 = targetData.x;
          var y2 = targetData.y;
          var color = floatColor(data.color);

          // Computing normals
          var dx = x2 - x1;
          var dy = y2 - y1;
          var len = dx * dx + dy * dy;
          var n1 = 0;
          var n2 = 0;
          if (len) {
            len = 1 / Math.sqrt(len);
            n1 = -dy * len * thickness;
            n2 = dx * len * thickness;
          }
          var array = this.array;
          array[startIndex++] = x2;
          array[startIndex++] = y2;
          array[startIndex++] = -n1;
          array[startIndex++] = -n2;
          array[startIndex++] = radius;
          array[startIndex++] = color;
          array[startIndex++] = edgeIndex;
        }
      }, {
        key: "setUniforms",
        value: function setUniforms(params, _ref2) {
          var gl = _ref2.gl,
            uniformLocations = _ref2.uniformLocations;
          var u_matrix = uniformLocations.u_matrix,
            u_sizeRatio = uniformLocations.u_sizeRatio,
            u_correctionRatio = uniformLocations.u_correctionRatio,
            u_minEdgeThickness = uniformLocations.u_minEdgeThickness,
            u_lengthToThicknessRatio = uniformLocations.u_lengthToThicknessRatio,
            u_widenessToThicknessRatio = uniformLocations.u_widenessToThicknessRatio;
          gl.uniformMatrix3fv(u_matrix, false, params.matrix);
          gl.uniform1f(u_sizeRatio, params.sizeRatio);
          gl.uniform1f(u_correctionRatio, params.correctionRatio);
          gl.uniform1f(u_minEdgeThickness, params.minEdgeThickness);
          gl.uniform1f(u_lengthToThicknessRatio, options.lengthToThicknessRatio);
          gl.uniform1f(u_widenessToThicknessRatio, options.widenessToThicknessRatio);
        }
      }]);
    }(EdgeProgram);
  }
  createEdgeArrowHeadProgram();

  // language=GLSL
  var SHADER_SOURCE$2 = /*glsl*/"\nprecision mediump float;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\nvarying float v_feather;\n\nconst vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);\n\nvoid main(void) {\n  // We only handle antialiasing for normal mode:\n  #ifdef PICKING_MODE\n  gl_FragColor = v_color;\n  #else\n  float dist = length(v_normal) * v_thickness;\n\n  float t = smoothstep(\n    v_thickness - v_feather,\n    v_thickness,\n    dist\n  );\n\n  gl_FragColor = mix(v_color, transparent, t);\n  #endif\n}\n";
  var FRAGMENT_SHADER_SOURCE = SHADER_SOURCE$2;

  // language=GLSL
  var SHADER_SOURCE$1 = /*glsl*/"\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_normal;\nattribute float a_normalCoef;\nattribute vec2 a_positionStart;\nattribute vec2 a_positionEnd;\nattribute float a_positionCoef;\nattribute float a_radius;\nattribute float a_radiusCoef;\n\nuniform mat3 u_matrix;\nuniform float u_zoomRatio;\nuniform float u_sizeRatio;\nuniform float u_pixelRatio;\nuniform float u_correctionRatio;\nuniform float u_minEdgeThickness;\nuniform float u_lengthToThicknessRatio;\nuniform float u_feather;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\nvarying float v_feather;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float minThickness = u_minEdgeThickness;\n\n  float radius = a_radius * a_radiusCoef;\n  vec2 normal = a_normal * a_normalCoef;\n  vec2 position = a_positionStart * (1.0 - a_positionCoef) + a_positionEnd * a_positionCoef;\n\n  float normalLength = length(normal);\n  vec2 unitNormal = normal / normalLength;\n\n  // These first computations are taken from edge.vert.glsl. Please read it to\n  // get better comments on what's happening:\n  float pixelsThickness = max(normalLength, minThickness * u_sizeRatio);\n  float webGLThickness = pixelsThickness * u_correctionRatio / u_sizeRatio;\n\n  // Here, we move the point to leave space for the arrow head:\n  float direction = sign(radius);\n  float webGLNodeRadius = direction * radius * 2.0 * u_correctionRatio / u_sizeRatio;\n  float webGLArrowHeadLength = webGLThickness * u_lengthToThicknessRatio * 2.0;\n\n  vec2 compensationVector = vec2(-direction * unitNormal.y, direction * unitNormal.x) * (webGLNodeRadius + webGLArrowHeadLength);\n\n  // Here is the proper position of the vertex\n  gl_Position = vec4((u_matrix * vec3(position + unitNormal * webGLThickness + compensationVector, 1)).xy, 0, 1);\n\n  v_thickness = webGLThickness / u_zoomRatio;\n\n  v_normal = unitNormal;\n\n  v_feather = u_feather * u_correctionRatio / u_zoomRatio / u_pixelRatio * 2.0;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n";
  var VERTEX_SHADER_SOURCE$1 = SHADER_SOURCE$1;

  var _WebGLRenderingContex$1 = WebGLRenderingContext,
    UNSIGNED_BYTE$1 = _WebGLRenderingContex$1.UNSIGNED_BYTE,
    FLOAT$1 = _WebGLRenderingContex$1.FLOAT;
  var UNIFORMS$1 = ["u_matrix", "u_zoomRatio", "u_sizeRatio", "u_correctionRatio", "u_pixelRatio", "u_feather", "u_minEdgeThickness", "u_lengthToThicknessRatio"];
  var DEFAULT_EDGE_CLAMPED_PROGRAM_OPTIONS = {
    lengthToThicknessRatio: DEFAULT_EDGE_ARROW_HEAD_PROGRAM_OPTIONS.lengthToThicknessRatio
  };
  function createEdgeClampedProgram(inputOptions) {
    var options = _objectSpread2(_objectSpread2({}, DEFAULT_EDGE_CLAMPED_PROGRAM_OPTIONS), {});
    return /*#__PURE__*/function (_EdgeProgram) {
      function EdgeClampedProgram() {
        _classCallCheck(this, EdgeClampedProgram);
        return _callSuper(this, EdgeClampedProgram, arguments);
      }
      _inherits(EdgeClampedProgram, _EdgeProgram);
      return _createClass(EdgeClampedProgram, [{
        key: "getDefinition",
        value: function getDefinition() {
          return {
            VERTICES: 6,
            VERTEX_SHADER_SOURCE: VERTEX_SHADER_SOURCE$1,
            FRAGMENT_SHADER_SOURCE: FRAGMENT_SHADER_SOURCE,
            METHOD: WebGLRenderingContext.TRIANGLES,
            UNIFORMS: UNIFORMS$1,
            ATTRIBUTES: [{
              name: "a_positionStart",
              size: 2,
              type: FLOAT$1
            }, {
              name: "a_positionEnd",
              size: 2,
              type: FLOAT$1
            }, {
              name: "a_normal",
              size: 2,
              type: FLOAT$1
            }, {
              name: "a_color",
              size: 4,
              type: UNSIGNED_BYTE$1,
              normalized: true
            }, {
              name: "a_id",
              size: 4,
              type: UNSIGNED_BYTE$1,
              normalized: true
            }, {
              name: "a_radius",
              size: 1,
              type: FLOAT$1
            }],
            CONSTANT_ATTRIBUTES: [
            // If 0, then position will be a_positionStart
            // If 1, then position will be a_positionEnd
            {
              name: "a_positionCoef",
              size: 1,
              type: FLOAT$1
            }, {
              name: "a_normalCoef",
              size: 1,
              type: FLOAT$1
            }, {
              name: "a_radiusCoef",
              size: 1,
              type: FLOAT$1
            }],
            CONSTANT_DATA: [[0, 1, 0], [0, -1, 0], [1, 1, 1], [1, 1, 1], [0, -1, 0], [1, -1, -1]]
          };
        }
      }, {
        key: "processVisibleItem",
        value: function processVisibleItem(edgeIndex, startIndex, sourceData, targetData, data) {
          var thickness = data.size || 1;
          var x1 = sourceData.x;
          var y1 = sourceData.y;
          var x2 = targetData.x;
          var y2 = targetData.y;
          var color = floatColor(data.color);

          // Computing normals
          var dx = x2 - x1;
          var dy = y2 - y1;
          var radius = targetData.size || 1;
          var len = dx * dx + dy * dy;
          var n1 = 0;
          var n2 = 0;
          if (len) {
            len = 1 / Math.sqrt(len);
            n1 = -dy * len * thickness;
            n2 = dx * len * thickness;
          }
          var array = this.array;
          array[startIndex++] = x1;
          array[startIndex++] = y1;
          array[startIndex++] = x2;
          array[startIndex++] = y2;
          array[startIndex++] = n1;
          array[startIndex++] = n2;
          array[startIndex++] = color;
          array[startIndex++] = edgeIndex;
          array[startIndex++] = radius;
        }
      }, {
        key: "setUniforms",
        value: function setUniforms(params, _ref) {
          var gl = _ref.gl,
            uniformLocations = _ref.uniformLocations;
          var u_matrix = uniformLocations.u_matrix,
            u_zoomRatio = uniformLocations.u_zoomRatio,
            u_feather = uniformLocations.u_feather,
            u_pixelRatio = uniformLocations.u_pixelRatio,
            u_correctionRatio = uniformLocations.u_correctionRatio,
            u_sizeRatio = uniformLocations.u_sizeRatio,
            u_minEdgeThickness = uniformLocations.u_minEdgeThickness,
            u_lengthToThicknessRatio = uniformLocations.u_lengthToThicknessRatio;
          gl.uniformMatrix3fv(u_matrix, false, params.matrix);
          gl.uniform1f(u_zoomRatio, params.zoomRatio);
          gl.uniform1f(u_sizeRatio, params.sizeRatio);
          gl.uniform1f(u_correctionRatio, params.correctionRatio);
          gl.uniform1f(u_pixelRatio, params.pixelRatio);
          gl.uniform1f(u_feather, params.antiAliasingFeather);
          gl.uniform1f(u_minEdgeThickness, params.minEdgeThickness);
          gl.uniform1f(u_lengthToThicknessRatio, options.lengthToThicknessRatio);
        }
      }]);
    }(EdgeProgram);
  }
  createEdgeClampedProgram();

  function createEdgeArrowProgram(inputOptions) {
    return createEdgeCompoundProgram([createEdgeClampedProgram(), createEdgeArrowHeadProgram()]);
  }
  var EdgeArrowProgram = createEdgeArrowProgram();
  var EdgeArrowProgram$1 = EdgeArrowProgram;

  // language=GLSL
  var SHADER_SOURCE = /*glsl*/"\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_normal;\nattribute float a_normalCoef;\nattribute vec2 a_positionStart;\nattribute vec2 a_positionEnd;\nattribute float a_positionCoef;\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_zoomRatio;\nuniform float u_pixelRatio;\nuniform float u_correctionRatio;\nuniform float u_minEdgeThickness;\nuniform float u_feather;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\nvarying float v_feather;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float minThickness = u_minEdgeThickness;\n\n  vec2 normal = a_normal * a_normalCoef;\n  vec2 position = a_positionStart * (1.0 - a_positionCoef) + a_positionEnd * a_positionCoef;\n\n  float normalLength = length(normal);\n  vec2 unitNormal = normal / normalLength;\n\n  // We require edges to be at least \"minThickness\" pixels thick *on screen*\n  // (so we need to compensate the size ratio):\n  float pixelsThickness = max(normalLength, minThickness * u_sizeRatio);\n\n  // Then, we need to retrieve the normalized thickness of the edge in the WebGL\n  // referential (in a ([0, 1], [0, 1]) space), using our \"magic\" correction\n  // ratio:\n  float webGLThickness = pixelsThickness * u_correctionRatio / u_sizeRatio;\n\n  // Here is the proper position of the vertex\n  gl_Position = vec4((u_matrix * vec3(position + unitNormal * webGLThickness, 1)).xy, 0, 1);\n\n  // For the fragment shader though, we need a thickness that takes the \"magic\"\n  // correction ratio into account (as in webGLThickness), but so that the\n  // antialiasing effect does not depend on the zoom level. So here's yet\n  // another thickness version:\n  v_thickness = webGLThickness / u_zoomRatio;\n\n  v_normal = unitNormal;\n\n  v_feather = u_feather * u_correctionRatio / u_zoomRatio / u_pixelRatio * 2.0;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n";
  var VERTEX_SHADER_SOURCE = SHADER_SOURCE;

  var _WebGLRenderingContex = WebGLRenderingContext,
    UNSIGNED_BYTE = _WebGLRenderingContex.UNSIGNED_BYTE,
    FLOAT = _WebGLRenderingContex.FLOAT;
  var UNIFORMS = ["u_matrix", "u_zoomRatio", "u_sizeRatio", "u_correctionRatio", "u_pixelRatio", "u_feather", "u_minEdgeThickness"];
  var EdgeRectangleProgram = /*#__PURE__*/function (_EdgeProgram) {
    function EdgeRectangleProgram() {
      _classCallCheck(this, EdgeRectangleProgram);
      return _callSuper(this, EdgeRectangleProgram, arguments);
    }
    _inherits(EdgeRectangleProgram, _EdgeProgram);
    return _createClass(EdgeRectangleProgram, [{
      key: "getDefinition",
      value: function getDefinition() {
        return {
          VERTICES: 6,
          VERTEX_SHADER_SOURCE: VERTEX_SHADER_SOURCE,
          FRAGMENT_SHADER_SOURCE: FRAGMENT_SHADER_SOURCE,
          METHOD: WebGLRenderingContext.TRIANGLES,
          UNIFORMS: UNIFORMS,
          ATTRIBUTES: [{
            name: "a_positionStart",
            size: 2,
            type: FLOAT
          }, {
            name: "a_positionEnd",
            size: 2,
            type: FLOAT
          }, {
            name: "a_normal",
            size: 2,
            type: FLOAT
          }, {
            name: "a_color",
            size: 4,
            type: UNSIGNED_BYTE,
            normalized: true
          }, {
            name: "a_id",
            size: 4,
            type: UNSIGNED_BYTE,
            normalized: true
          }],
          CONSTANT_ATTRIBUTES: [
          // If 0, then position will be a_positionStart
          // If 2, then position will be a_positionEnd
          {
            name: "a_positionCoef",
            size: 1,
            type: FLOAT
          }, {
            name: "a_normalCoef",
            size: 1,
            type: FLOAT
          }],
          CONSTANT_DATA: [[0, 1], [0, -1], [1, 1], [1, 1], [0, -1], [1, -1]]
        };
      }
    }, {
      key: "processVisibleItem",
      value: function processVisibleItem(edgeIndex, startIndex, sourceData, targetData, data) {
        var thickness = data.size || 1;
        var x1 = sourceData.x;
        var y1 = sourceData.y;
        var x2 = targetData.x;
        var y2 = targetData.y;
        var color = floatColor(data.color);

        // Computing normals
        var dx = x2 - x1;
        var dy = y2 - y1;
        var len = dx * dx + dy * dy;
        var n1 = 0;
        var n2 = 0;
        if (len) {
          len = 1 / Math.sqrt(len);
          n1 = -dy * len * thickness;
          n2 = dx * len * thickness;
        }
        var array = this.array;
        array[startIndex++] = x1;
        array[startIndex++] = y1;
        array[startIndex++] = x2;
        array[startIndex++] = y2;
        array[startIndex++] = n1;
        array[startIndex++] = n2;
        array[startIndex++] = color;
        array[startIndex++] = edgeIndex;
      }
    }, {
      key: "setUniforms",
      value: function setUniforms(params, _ref) {
        var gl = _ref.gl,
          uniformLocations = _ref.uniformLocations;
        var u_matrix = uniformLocations.u_matrix,
          u_zoomRatio = uniformLocations.u_zoomRatio,
          u_feather = uniformLocations.u_feather,
          u_pixelRatio = uniformLocations.u_pixelRatio,
          u_correctionRatio = uniformLocations.u_correctionRatio,
          u_sizeRatio = uniformLocations.u_sizeRatio,
          u_minEdgeThickness = uniformLocations.u_minEdgeThickness;
        gl.uniformMatrix3fv(u_matrix, false, params.matrix);
        gl.uniform1f(u_zoomRatio, params.zoomRatio);
        gl.uniform1f(u_sizeRatio, params.sizeRatio);
        gl.uniform1f(u_correctionRatio, params.correctionRatio);
        gl.uniform1f(u_pixelRatio, params.pixelRatio);
        gl.uniform1f(u_feather, params.antiAliasingFeather);
        gl.uniform1f(u_minEdgeThickness, params.minEdgeThickness);
      }
    }]);
  }(EdgeProgram);

  var domain;

  // This constructor is used to store event handlers. Instantiating this is
  // faster than explicitly calling `Object.create(null)` to get a "clean" empty
  // object (tested with v8 v4.9).
  function EventHandlers() {}
  EventHandlers.prototype = Object.create(null);

  function EventEmitter() {
    EventEmitter.init.call(this);
  }

  // nodejs oddity
  // require('events') === require('events').EventEmitter
  EventEmitter.EventEmitter = EventEmitter;

  EventEmitter.usingDomains = false;

  EventEmitter.prototype.domain = undefined;
  EventEmitter.prototype._events = undefined;
  EventEmitter.prototype._maxListeners = undefined;

  // By default EventEmitters will print a warning if more than 10 listeners are
  // added to it. This is a useful default which helps finding memory leaks.
  EventEmitter.defaultMaxListeners = 10;

  EventEmitter.init = function() {
    this.domain = null;
    if (EventEmitter.usingDomains) {
      // if there is an active domain, then attach to it.
      if (domain.active && !(this instanceof domain.Domain)) {
        this.domain = domain.active;
      }
    }

    if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
      this._events = new EventHandlers();
      this._eventsCount = 0;
    }

    this._maxListeners = this._maxListeners || undefined;
  };

  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.
  EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0 || isNaN(n))
      throw new TypeError('"n" argument must be a positive number');
    this._maxListeners = n;
    return this;
  };

  function $getMaxListeners(that) {
    if (that._maxListeners === undefined)
      return EventEmitter.defaultMaxListeners;
    return that._maxListeners;
  }

  EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    return $getMaxListeners(this);
  };

  // These standalone emit* functions are used to optimize calling of event
  // handlers for fast cases because emit() itself often has a variable number of
  // arguments and can be deoptimized because of that. These functions always have
  // the same number of arguments and thus do not get deoptimized, so the code
  // inside them can execute faster.
  function emitNone(handler, isFn, self) {
    if (isFn)
      handler.call(self);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self);
    }
  }
  function emitOne(handler, isFn, self, arg1) {
    if (isFn)
      handler.call(self, arg1);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self, arg1);
    }
  }
  function emitTwo(handler, isFn, self, arg1, arg2) {
    if (isFn)
      handler.call(self, arg1, arg2);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self, arg1, arg2);
    }
  }
  function emitThree(handler, isFn, self, arg1, arg2, arg3) {
    if (isFn)
      handler.call(self, arg1, arg2, arg3);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self, arg1, arg2, arg3);
    }
  }

  function emitMany(handler, isFn, self, args) {
    if (isFn)
      handler.apply(self, args);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].apply(self, args);
    }
  }

  EventEmitter.prototype.emit = function emit(type) {
    var er, handler, len, args, i, events, domain;
    var doError = (type === 'error');

    events = this._events;
    if (events)
      doError = (doError && events.error == null);
    else if (!doError)
      return false;

    domain = this.domain;

    // If there is no 'error' event listener then throw.
    if (doError) {
      er = arguments[1];
      if (domain) {
        if (!er)
          er = new Error('Uncaught, unspecified "error" event');
        er.domainEmitter = this;
        er.domain = domain;
        er.domainThrown = false;
        domain.emit('error', er);
      } else if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
      return false;
    }

    handler = events[type];

    if (!handler)
      return false;

    var isFn = typeof handler === 'function';
    len = arguments.length;
    switch (len) {
      // fast cases
      case 1:
        emitNone(handler, isFn, this);
        break;
      case 2:
        emitOne(handler, isFn, this, arguments[1]);
        break;
      case 3:
        emitTwo(handler, isFn, this, arguments[1], arguments[2]);
        break;
      case 4:
        emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
        break;
      // slower
      default:
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        emitMany(handler, isFn, this, args);
    }

    return true;
  };

  function _addListener(target, type, listener, prepend) {
    var m;
    var events;
    var existing;

    if (typeof listener !== 'function')
      throw new TypeError('"listener" argument must be a function');

    events = target._events;
    if (!events) {
      events = target._events = new EventHandlers();
      target._eventsCount = 0;
    } else {
      // To avoid recursion in the case that type === "newListener"! Before
      // adding it to the listeners, first emit "newListener".
      if (events.newListener) {
        target.emit('newListener', type,
                    listener.listener ? listener.listener : listener);

        // Re-assign `events` because a newListener handler could have caused the
        // this._events to be assigned to a new object
        events = target._events;
      }
      existing = events[type];
    }

    if (!existing) {
      // Optimize the case of one listener. Don't need the extra array object.
      existing = events[type] = listener;
      ++target._eventsCount;
    } else {
      if (typeof existing === 'function') {
        // Adding the second element, need to change to array.
        existing = events[type] = prepend ? [listener, existing] :
                                            [existing, listener];
      } else {
        // If we've already got an array, just append.
        if (prepend) {
          existing.unshift(listener);
        } else {
          existing.push(listener);
        }
      }

      // Check for listener leak
      if (!existing.warned) {
        m = $getMaxListeners(target);
        if (m && m > 0 && existing.length > m) {
          existing.warned = true;
          var w = new Error('Possible EventEmitter memory leak detected. ' +
                              existing.length + ' ' + type + ' listeners added. ' +
                              'Use emitter.setMaxListeners() to increase limit');
          w.name = 'MaxListenersExceededWarning';
          w.emitter = target;
          w.type = type;
          w.count = existing.length;
          emitWarning(w);
        }
      }
    }

    return target;
  }
  function emitWarning(e) {
    typeof console.warn === 'function' ? console.warn(e) : console.log(e);
  }
  EventEmitter.prototype.addListener = function addListener(type, listener) {
    return _addListener(this, type, listener, false);
  };

  EventEmitter.prototype.on = EventEmitter.prototype.addListener;

  EventEmitter.prototype.prependListener =
      function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };

  function _onceWrap(target, type, listener) {
    var fired = false;
    function g() {
      target.removeListener(type, g);
      if (!fired) {
        fired = true;
        listener.apply(target, arguments);
      }
    }
    g.listener = listener;
    return g;
  }

  EventEmitter.prototype.once = function once(type, listener) {
    if (typeof listener !== 'function')
      throw new TypeError('"listener" argument must be a function');
    this.on(type, _onceWrap(this, type, listener));
    return this;
  };

  EventEmitter.prototype.prependOnceListener =
      function prependOnceListener(type, listener) {
        if (typeof listener !== 'function')
          throw new TypeError('"listener" argument must be a function');
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };

  // emits a 'removeListener' event iff the listener was removed
  EventEmitter.prototype.removeListener =
      function removeListener(type, listener) {
        var list, events, position, i, originalListener;

        if (typeof listener !== 'function')
          throw new TypeError('"listener" argument must be a function');

        events = this._events;
        if (!events)
          return this;

        list = events[type];
        if (!list)
          return this;

        if (list === listener || (list.listener && list.listener === listener)) {
          if (--this._eventsCount === 0)
            this._events = new EventHandlers();
          else {
            delete events[type];
            if (events.removeListener)
              this.emit('removeListener', type, list.listener || listener);
          }
        } else if (typeof list !== 'function') {
          position = -1;

          for (i = list.length; i-- > 0;) {
            if (list[i] === listener ||
                (list[i].listener && list[i].listener === listener)) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }

          if (position < 0)
            return this;

          if (list.length === 1) {
            list[0] = undefined;
            if (--this._eventsCount === 0) {
              this._events = new EventHandlers();
              return this;
            } else {
              delete events[type];
            }
          } else {
            spliceOne(list, position);
          }

          if (events.removeListener)
            this.emit('removeListener', type, originalListener || listener);
        }

        return this;
      };
      
  // Alias for removeListener added in NodeJS 10.0
  // https://nodejs.org/api/events.html#events_emitter_off_eventname_listener
  EventEmitter.prototype.off = function(type, listener){
      return this.removeListener(type, listener);
  };

  EventEmitter.prototype.removeAllListeners =
      function removeAllListeners(type) {
        var listeners, events;

        events = this._events;
        if (!events)
          return this;

        // not listening for removeListener, no need to emit
        if (!events.removeListener) {
          if (arguments.length === 0) {
            this._events = new EventHandlers();
            this._eventsCount = 0;
          } else if (events[type]) {
            if (--this._eventsCount === 0)
              this._events = new EventHandlers();
            else
              delete events[type];
          }
          return this;
        }

        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
          var keys = Object.keys(events);
          for (var i = 0, key; i < keys.length; ++i) {
            key = keys[i];
            if (key === 'removeListener') continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners('removeListener');
          this._events = new EventHandlers();
          this._eventsCount = 0;
          return this;
        }

        listeners = events[type];

        if (typeof listeners === 'function') {
          this.removeListener(type, listeners);
        } else if (listeners) {
          // LIFO order
          do {
            this.removeListener(type, listeners[listeners.length - 1]);
          } while (listeners[0]);
        }

        return this;
      };

  EventEmitter.prototype.listeners = function listeners(type) {
    var evlistener;
    var ret;
    var events = this._events;

    if (!events)
      ret = [];
    else {
      evlistener = events[type];
      if (!evlistener)
        ret = [];
      else if (typeof evlistener === 'function')
        ret = [evlistener.listener || evlistener];
      else
        ret = unwrapListeners(evlistener);
    }

    return ret;
  };

  EventEmitter.listenerCount = function(emitter, type) {
    if (typeof emitter.listenerCount === 'function') {
      return emitter.listenerCount(type);
    } else {
      return listenerCount.call(emitter, type);
    }
  };

  EventEmitter.prototype.listenerCount = listenerCount;
  function listenerCount(type) {
    var events = this._events;

    if (events) {
      var evlistener = events[type];

      if (typeof evlistener === 'function') {
        return 1;
      } else if (evlistener) {
        return evlistener.length;
      }
    }

    return 0;
  }

  EventEmitter.prototype.eventNames = function eventNames() {
    return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
  };

  // About 1.5x faster than the two-arg version of Array#splice().
  function spliceOne(list, index) {
    for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
      list[i] = list[k];
    list.pop();
  }

  function arrayClone(arr, i) {
    var copy = new Array(i);
    while (i--)
      copy[i] = arr[i];
    return copy;
  }

  function unwrapListeners(arr) {
    var ret = new Array(arr.length);
    for (var i = 0; i < ret.length; ++i) {
      ret[i] = arr[i].listener || arr[i];
    }
    return ret;
  }

  /**
   * Util type to represent maps of typed elements, but implemented with
   * JavaScript objects.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  /**
   * Returns a type similar to T, but with the K set of properties of the type
   * T *required*, and the rest optional.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  /**
   * Returns a type similar to Partial<T>, but with at least one key set.
   */

  /**
   * Custom event emitter types.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  var TypedEventEmitter = /*#__PURE__*/function (_ref) {
    function TypedEventEmitter() {
      var _this;
      _classCallCheck(this, TypedEventEmitter);
      _this = _callSuper(this, TypedEventEmitter);
      _this.rawEmitter = _this;
      return _this;
    }
    _inherits(TypedEventEmitter, _ref);
    return _createClass(TypedEventEmitter);
  }(EventEmitter);

  /**
   * Graphology isGraph
   * ===================
   *
   * Very simple function aiming at ensuring the given variable is a
   * graphology instance.
   */

  /**
   * Checking the value is a graphology instance.
   *
   * @param  {any}     value - Target value.
   * @return {boolean}
   */
  var isGraph = function isGraph(value) {
    return (
      value !== null &&
      typeof value === 'object' &&
      typeof value.addUndirectedEdgeWithKey === 'function' &&
      typeof value.dropNode === 'function' &&
      typeof value.multi === 'boolean'
    );
  };

  var linear = function linear(k) {
    return k;
  };
  var quadraticIn = function quadraticIn(k) {
    return k * k;
  };
  var quadraticOut = function quadraticOut(k) {
    return k * (2 - k);
  };
  var quadraticInOut = function quadraticInOut(k) {
    if ((k *= 2) < 1) return 0.5 * k * k;
    return -0.5 * (--k * (k - 2) - 1);
  };
  var cubicIn = function cubicIn(k) {
    return k * k * k;
  };
  var cubicOut = function cubicOut(k) {
    return --k * k * k + 1;
  };
  var cubicInOut = function cubicInOut(k) {
    if ((k *= 2) < 1) return 0.5 * k * k * k;
    return 0.5 * ((k -= 2) * k * k + 2);
  };
  var easings = {
    linear: linear,
    quadraticIn: quadraticIn,
    quadraticOut: quadraticOut,
    quadraticInOut: quadraticInOut,
    cubicIn: cubicIn,
    cubicOut: cubicOut,
    cubicInOut: cubicInOut
  };

  /**
   * Defaults.
   */

  var ANIMATE_DEFAULTS = {
    easing: "quadraticInOut",
    duration: 150
  };

  function identity() {
    return Float32Array.of(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }

  // TODO: optimize
  function scale(m, x, y) {
    m[0] = x;
    m[4] = typeof y === "number" ? y : x;
    return m;
  }
  function rotate(m, r) {
    var s = Math.sin(r),
      c = Math.cos(r);
    m[0] = c;
    m[1] = s;
    m[3] = -s;
    m[4] = c;
    return m;
  }
  function translate(m, x, y) {
    m[6] = x;
    m[7] = y;
    return m;
  }
  function multiply(a, b) {
    var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
    var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
    var a20 = a[6],
      a21 = a[7],
      a22 = a[8];
    var b00 = b[0],
      b01 = b[1],
      b02 = b[2];
    var b10 = b[3],
      b11 = b[4],
      b12 = b[5];
    var b20 = b[6],
      b21 = b[7],
      b22 = b[8];
    a[0] = b00 * a00 + b01 * a10 + b02 * a20;
    a[1] = b00 * a01 + b01 * a11 + b02 * a21;
    a[2] = b00 * a02 + b01 * a12 + b02 * a22;
    a[3] = b10 * a00 + b11 * a10 + b12 * a20;
    a[4] = b10 * a01 + b11 * a11 + b12 * a21;
    a[5] = b10 * a02 + b11 * a12 + b12 * a22;
    a[6] = b20 * a00 + b21 * a10 + b22 * a20;
    a[7] = b20 * a01 + b21 * a11 + b22 * a21;
    a[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return a;
  }
  function multiplyVec2(a, b) {
    var z = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
    var a00 = a[0];
    var a01 = a[1];
    var a10 = a[3];
    var a11 = a[4];
    var a20 = a[6];
    var a21 = a[7];
    var b0 = b.x;
    var b1 = b.y;
    return {
      x: b0 * a00 + b1 * a10 + a20 * z,
      y: b0 * a01 + b1 * a11 + a21 * z
    };
  }

  /**
   * In sigma, the graph is normalized into a [0, 1], [0, 1] square, before being given to the various renderers. This
   * helps to deal with quadtree in particular.
   * But at some point, we need to rescale it so that it takes the best place in the screen, i.e. we always want to see two
   * nodes "touching" opposite sides of the graph, with the camera being at its default state.
   *
   * This function determines this ratio.
   */
  function getCorrectionRatio(viewportDimensions, graphDimensions) {
    var viewportRatio = viewportDimensions.height / viewportDimensions.width;
    var graphRatio = graphDimensions.height / graphDimensions.width;

    // If the stage and the graphs are in different directions (such as the graph being wider that tall while the stage
    // is taller than wide), we can stop here to have indeed nodes touching opposite sides:
    if (viewportRatio < 1 && graphRatio > 1 || viewportRatio > 1 && graphRatio < 1) {
      return 1;
    }

    // Else, we need to fit the graph inside the stage:
    // 1. If the graph is "squarer" (i.e. with a ratio closer to 1), we need to make the largest sides touch;
    // 2. If the stage is "squarer", we need to make the smallest sides touch.
    return Math.min(Math.max(graphRatio, 1 / graphRatio), Math.max(1 / viewportRatio, viewportRatio));
  }

  /**
   * Function returning a matrix from the current state of the camera.
   */
  function matrixFromCamera(state, viewportDimensions, graphDimensions, padding, inverse) {
    // TODO: it's possible to optimize this drastically!
    var angle = state.angle,
      ratio = state.ratio,
      x = state.x,
      y = state.y;
    var width = viewportDimensions.width,
      height = viewportDimensions.height;
    var matrix = identity();
    var smallestDimension = Math.min(width, height) - 2 * padding;
    var correctionRatio = getCorrectionRatio(viewportDimensions, graphDimensions);
    if (!inverse) {
      multiply(matrix, scale(identity(), 2 * (smallestDimension / width) * correctionRatio, 2 * (smallestDimension / height) * correctionRatio));
      multiply(matrix, rotate(identity(), -angle));
      multiply(matrix, scale(identity(), 1 / ratio));
      multiply(matrix, translate(identity(), -x, -y));
    } else {
      multiply(matrix, translate(identity(), x, y));
      multiply(matrix, scale(identity(), ratio));
      multiply(matrix, rotate(identity(), angle));
      multiply(matrix, scale(identity(), width / smallestDimension / 2 / correctionRatio, height / smallestDimension / 2 / correctionRatio));
    }
    return matrix;
  }

  /**
   * All these transformations we apply on the matrix to get it rescale the graph
   * as we want make it very hard to get pixel-perfect distances in WebGL. This
   * function returns a factor that properly cancels the matrix effect on lengths.
   *
   * [jacomyal]
   * To be fully honest, I can't really explain happens here... I notice that the
   * following ratio works (i.e. it correctly compensates the matrix impact on all
   * camera states I could try):
   * > `R = size(V) / size(M * V) / W`
   * as long as `M * V` is in the direction of W (ie. parallel to (Ox)). It works
   * as well with H and a vector that transforms into something parallel to (Oy).
   *
   * Also, note that we use `angle` and not `-angle` (that would seem logical,
   * since we want to anticipate the rotation), because the image is vertically
   * swapped in WebGL.
   */
  function getMatrixImpact(matrix, cameraState, viewportDimensions) {
    var _multiplyVec = multiplyVec2(matrix, {
        x: Math.cos(cameraState.angle),
        y: Math.sin(cameraState.angle)
      }, 0),
      x = _multiplyVec.x,
      y = _multiplyVec.y;
    return 1 / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) / viewportDimensions.width;
  }

  /**
   * Function returning the graph's node extent in x & y.
   */
  function graphExtent(graph) {
    if (!graph.order) return {
      x: [0, 1],
      y: [0, 1]
    };
    var xMin = Infinity;
    var xMax = -Infinity;
    var yMin = Infinity;
    var yMax = -Infinity;
    graph.forEachNode(function (_, attr) {
      var x = attr.x,
        y = attr.y;
      if (x < xMin) xMin = x;
      if (x > xMax) xMax = x;
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    });
    return {
      x: [xMin, xMax],
      y: [yMin, yMax]
    };
  }

  /**
   * Check if the graph variable is a valid graph, and if sigma can render it.
   */
  function validateGraph(graph) {
    // check if it's a valid graphology instance
    if (!isGraph(graph)) throw new Error("Sigma: invalid graph instance.");

    // check if nodes have x/y attributes
    graph.forEachNode(function (key, attributes) {
      if (!Number.isFinite(attributes.x) || !Number.isFinite(attributes.y)) {
        throw new Error("Sigma: Coordinates of node ".concat(key, " are invalid. A node must have a numeric 'x' and 'y' attribute."));
      }
    });
  }

  /**
   * Function used to create DOM elements easily.
   */
  function createElement(tag, style, attributes) {
    var element = document.createElement(tag);
    if (style) {
      for (var k in style) {
        element.style[k] = style[k];
      }
    }
    if (attributes) {
      for (var _k in attributes) {
        element.setAttribute(_k, attributes[_k]);
      }
    }
    return element;
  }

  /**
   * Function returning the browser's pixel ratio.
   */
  function getPixelRatio() {
    if (typeof window.devicePixelRatio !== "undefined") return window.devicePixelRatio;
    return 1;
  }

  /**
   * Function ordering the given elements in reverse z-order so they drawn
   * the correct way.
   */
  function zIndexOrdering(_extent, getter, elements) {
    // If k is > n, we'll use a standard sort
    return elements.sort(function (a, b) {
      var zA = getter(a) || 0,
        zB = getter(b) || 0;
      if (zA < zB) return -1;
      if (zA > zB) return 1;
      return 0;
    });

    // TODO: counting sort optimization
  }

  /**
   * Factory returning a function normalizing the given node's position & size.
   */

  function createNormalizationFunction(extent) {
    var _extent$x = _slicedToArray(extent.x, 2),
      minX = _extent$x[0],
      maxX = _extent$x[1],
      _extent$y = _slicedToArray(extent.y, 2),
      minY = _extent$y[0],
      maxY = _extent$y[1];
    var ratio = Math.max(maxX - minX, maxY - minY),
      dX = (maxX + minX) / 2,
      dY = (maxY + minY) / 2;
    if (ratio === 0 || Math.abs(ratio) === Infinity || isNaN(ratio)) ratio = 1;
    if (isNaN(dX)) dX = 0;
    if (isNaN(dY)) dY = 0;
    var fn = function fn(data) {
      return {
        x: 0.5 + (data.x - dX) / ratio,
        y: 0.5 + (data.y - dY) / ratio
      };
    };

    // TODO: possibility to apply this in batch over array of indices
    fn.applyTo = function (data) {
      data.x = 0.5 + (data.x - dX) / ratio;
      data.y = 0.5 + (data.y - dY) / ratio;
    };
    fn.inverse = function (data) {
      return {
        x: dX + ratio * (data.x - 0.5),
        y: dY + ratio * (data.y - 0.5)
      };
    };
    fn.ratio = ratio;
    return fn;
  }

  function _typeof(o) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
      return typeof o;
    } : function (o) {
      return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
    }, _typeof(o);
  }

  /**
   * Extends the target array with the given values.
   */
  function extend(array, values) {
    var l2 = values.size;
    if (l2 === 0) return;
    var l1 = array.length;
    array.length += l2;
    var i = 0;
    values.forEach(function (value) {
      array[l1 + i] = value;
      i++;
    });
  }

  /**
   * Helper to use `Object.assign` with more than two objects.
   */
  function assign(target) {
    target = target || {};
    for (var i = 0, l = arguments.length <= 1 ? 0 : arguments.length - 1; i < l; i++) {
      var o = i + 1 < 1 || arguments.length <= i + 1 ? undefined : arguments[i + 1];
      if (!o) continue;
      Object.assign(target, o);
    }
    return target;
  }

  /**
   * Sigma.js Settings
   * =================================
   *
   * The list of settings and some handy functions.
   * @module
   */

  /**
   * Sigma.js settings
   * =================================
   */

  var DEFAULT_SETTINGS = {
    // Performance
    hideEdgesOnMove: false,
    hideLabelsOnMove: false,
    renderLabels: true,
    renderEdgeLabels: false,
    enableEdgeEvents: false,
    // Component rendering
    defaultNodeColor: "#999",
    defaultNodeType: "circle",
    defaultEdgeColor: "#ccc",
    defaultEdgeType: "line",
    labelFont: "Arial",
    labelSize: 14,
    labelWeight: "normal",
    labelColor: {
      color: "#000"
    },
    edgeLabelFont: "Arial",
    edgeLabelSize: 14,
    edgeLabelWeight: "normal",
    edgeLabelColor: {
      attribute: "color"
    },
    stagePadding: 30,
    defaultDrawEdgeLabel: drawStraightEdgeLabel,
    defaultDrawNodeLabel: drawDiscNodeLabel,
    defaultDrawNodeHover: drawDiscNodeHover,
    minEdgeThickness: 1.7,
    antiAliasingFeather: 1,
    // Mouse and touch settings
    dragTimeout: 100,
    draggedEventsTolerance: 3,
    inertiaDuration: 200,
    inertiaRatio: 3,
    zoomDuration: 250,
    zoomingRatio: 1.7,
    doubleClickTimeout: 300,
    doubleClickZoomingRatio: 2.2,
    doubleClickZoomingDuration: 200,
    tapMoveTolerance: 10,
    // Size and scaling
    zoomToSizeRatioFunction: Math.sqrt,
    itemSizesReference: "screen",
    autoRescale: true,
    autoCenter: true,
    // Labels
    labelDensity: 1,
    labelGridCellSize: 100,
    labelRenderedSizeThreshold: 6,
    // Reducers
    nodeReducer: null,
    edgeReducer: null,
    // Features
    zIndex: false,
    minCameraRatio: null,
    maxCameraRatio: null,
    enableCameraZooming: true,
    enableCameraPanning: true,
    enableCameraRotation: true,
    cameraPanBoundaries: null,
    // Lifecycle
    allowInvalidContainer: false,
    // Program classes
    nodeProgramClasses: {},
    nodeHoverProgramClasses: {},
    edgeProgramClasses: {}
  };
  var DEFAULT_NODE_PROGRAM_CLASSES = {
    circle: NodeCircleProgram
  };
  var DEFAULT_EDGE_PROGRAM_CLASSES = {
    arrow: EdgeArrowProgram$1,
    line: EdgeRectangleProgram
  };
  function validateSettings(settings) {
    if (typeof settings.labelDensity !== "number" || settings.labelDensity < 0) {
      throw new Error("Settings: invalid `labelDensity`. Expecting a positive number.");
    }
    var minCameraRatio = settings.minCameraRatio,
      maxCameraRatio = settings.maxCameraRatio;
    if (typeof minCameraRatio === "number" && typeof maxCameraRatio === "number" && maxCameraRatio < minCameraRatio) {
      throw new Error("Settings: invalid camera ratio boundaries. Expecting `maxCameraRatio` to be greater than `minCameraRatio`.");
    }
  }
  function resolveSettings(settings) {
    var resolvedSettings = assign({}, DEFAULT_SETTINGS, settings);
    resolvedSettings.nodeProgramClasses = assign({}, DEFAULT_NODE_PROGRAM_CLASSES, resolvedSettings.nodeProgramClasses);
    resolvedSettings.edgeProgramClasses = assign({}, DEFAULT_EDGE_PROGRAM_CLASSES, resolvedSettings.edgeProgramClasses);
    return resolvedSettings;
  }

  /**
   * Defaults.
   */
  var DEFAULT_ZOOMING_RATIO = 1.5;

  /**
   * Event types.
   */
  /**
   * Camera class
   */
  var Camera = /*#__PURE__*/function (_TypedEventEmitter) {
    function Camera() {
      var _this;
      _classCallCheck(this, Camera);
      _this = _callSuper(this, Camera);

      // State
      _defineProperty(_this, "x", 0.5);
      _defineProperty(_this, "y", 0.5);
      _defineProperty(_this, "angle", 0);
      _defineProperty(_this, "ratio", 1);
      _defineProperty(_this, "minRatio", null);
      _defineProperty(_this, "maxRatio", null);
      _defineProperty(_this, "enabledZooming", true);
      _defineProperty(_this, "enabledPanning", true);
      _defineProperty(_this, "enabledRotation", true);
      _defineProperty(_this, "clean", null);
      _defineProperty(_this, "nextFrame", null);
      _defineProperty(_this, "previousState", null);
      _defineProperty(_this, "enabled", true);
      _this.previousState = _this.getState();
      return _this;
    }

    /**
     * Static method used to create a Camera object with a given state.
     */
    _inherits(Camera, _TypedEventEmitter);
    return _createClass(Camera, [{
      key: "enable",
      value:
      /**
       * Method used to enable the camera.
       */
      function enable() {
        this.enabled = true;
        return this;
      }

      /**
       * Method used to disable the camera.
       */
    }, {
      key: "disable",
      value: function disable() {
        this.enabled = false;
        return this;
      }

      /**
       * Method used to retrieve the camera's current state.
       */
    }, {
      key: "getState",
      value: function getState() {
        return {
          x: this.x,
          y: this.y,
          angle: this.angle,
          ratio: this.ratio
        };
      }

      /**
       * Method used to check whether the camera has the given state.
       */
    }, {
      key: "hasState",
      value: function hasState(state) {
        return this.x === state.x && this.y === state.y && this.ratio === state.ratio && this.angle === state.angle;
      }

      /**
       * Method used to retrieve the camera's previous state.
       */
    }, {
      key: "getPreviousState",
      value: function getPreviousState() {
        var state = this.previousState;
        if (!state) return null;
        return {
          x: state.x,
          y: state.y,
          angle: state.angle,
          ratio: state.ratio
        };
      }

      /**
       * Method used to check minRatio and maxRatio values.
       */
    }, {
      key: "getBoundedRatio",
      value: function getBoundedRatio(ratio) {
        var r = ratio;
        if (typeof this.minRatio === "number") r = Math.max(r, this.minRatio);
        if (typeof this.maxRatio === "number") r = Math.min(r, this.maxRatio);
        return r;
      }

      /**
       * Method used to check various things to return a legit state candidate.
       */
    }, {
      key: "validateState",
      value: function validateState(state) {
        var validatedState = {};
        if (this.enabledPanning && typeof state.x === "number") validatedState.x = state.x;
        if (this.enabledPanning && typeof state.y === "number") validatedState.y = state.y;
        if (this.enabledZooming && typeof state.ratio === "number") validatedState.ratio = this.getBoundedRatio(state.ratio);
        if (this.enabledRotation && typeof state.angle === "number") validatedState.angle = state.angle;
        return this.clean ? this.clean(_objectSpread2(_objectSpread2({}, this.getState()), validatedState)) : validatedState;
      }

      /**
       * Method used to check whether the camera is currently being animated.
       */
    }, {
      key: "isAnimated",
      value: function isAnimated() {
        return !!this.nextFrame;
      }

      /**
       * Method used to set the camera's state.
       */
    }, {
      key: "setState",
      value: function setState(state) {
        if (!this.enabled) return this;

        // Keeping track of last state
        this.previousState = this.getState();
        var validState = this.validateState(state);
        if (typeof validState.x === "number") this.x = validState.x;
        if (typeof validState.y === "number") this.y = validState.y;
        if (typeof validState.ratio === "number") this.ratio = validState.ratio;
        if (typeof validState.angle === "number") this.angle = validState.angle;

        // Emitting
        if (!this.hasState(this.previousState)) this.emit("updated", this.getState());
        return this;
      }

      /**
       * Method used to update the camera's state using a function.
       */
    }, {
      key: "updateState",
      value: function updateState(updater) {
        this.setState(updater(this.getState()));
        return this;
      }

      /**
       * Method used to animate the camera.
       */
    }, {
      key: "animate",
      value: function animate(state) {
        var _this2 = this;
        var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var callback = arguments.length > 2 ? arguments[2] : undefined;
        if (!callback) return new Promise(function (resolve) {
          return _this2.animate(state, opts, resolve);
        });
        if (!this.enabled) return;
        var options = _objectSpread2(_objectSpread2({}, ANIMATE_DEFAULTS), opts);
        var validState = this.validateState(state);
        var easing = typeof options.easing === "function" ? options.easing : easings[options.easing];

        // State
        var start = Date.now(),
          initialState = this.getState();

        // Function performing the animation
        var _fn = function fn() {
          var t = (Date.now() - start) / options.duration;

          // The animation is over:
          if (t >= 1) {
            _this2.nextFrame = null;
            _this2.setState(validState);
            if (_this2.animationCallback) {
              _this2.animationCallback.call(null);
              _this2.animationCallback = undefined;
            }
            return;
          }
          var coefficient = easing(t);
          var newState = {};
          if (typeof validState.x === "number") newState.x = initialState.x + (validState.x - initialState.x) * coefficient;
          if (typeof validState.y === "number") newState.y = initialState.y + (validState.y - initialState.y) * coefficient;
          if (_this2.enabledRotation && typeof validState.angle === "number") newState.angle = initialState.angle + (validState.angle - initialState.angle) * coefficient;
          if (typeof validState.ratio === "number") newState.ratio = initialState.ratio + (validState.ratio - initialState.ratio) * coefficient;
          _this2.setState(newState);
          _this2.nextFrame = requestAnimationFrame(_fn);
        };
        if (this.nextFrame) {
          cancelAnimationFrame(this.nextFrame);
          if (this.animationCallback) this.animationCallback.call(null);
          this.nextFrame = requestAnimationFrame(_fn);
        } else {
          _fn();
        }
        this.animationCallback = callback;
      }

      /**
       * Method used to zoom the camera.
       */
    }, {
      key: "animatedZoom",
      value: function animatedZoom(factorOrOptions) {
        if (!factorOrOptions) return this.animate({
          ratio: this.ratio / DEFAULT_ZOOMING_RATIO
        });
        if (typeof factorOrOptions === "number") return this.animate({
          ratio: this.ratio / factorOrOptions
        });
        return this.animate({
          ratio: this.ratio / (factorOrOptions.factor || DEFAULT_ZOOMING_RATIO)
        }, factorOrOptions);
      }

      /**
       * Method used to unzoom the camera.
       */
    }, {
      key: "animatedUnzoom",
      value: function animatedUnzoom(factorOrOptions) {
        if (!factorOrOptions) return this.animate({
          ratio: this.ratio * DEFAULT_ZOOMING_RATIO
        });
        if (typeof factorOrOptions === "number") return this.animate({
          ratio: this.ratio * factorOrOptions
        });
        return this.animate({
          ratio: this.ratio * (factorOrOptions.factor || DEFAULT_ZOOMING_RATIO)
        }, factorOrOptions);
      }

      /**
       * Method used to reset the camera.
       */
    }, {
      key: "animatedReset",
      value: function animatedReset(options) {
        return this.animate({
          x: 0.5,
          y: 0.5,
          ratio: 1,
          angle: 0
        }, options);
      }

      /**
       * Returns a new Camera instance, with the same state as the current camera.
       */
    }, {
      key: "copy",
      value: function copy() {
        return Camera.from(this.getState());
      }
    }], [{
      key: "from",
      value: function from(state) {
        var camera = new Camera();
        return camera.setState(state);
      }
    }]);
  }(TypedEventEmitter);

  /**
   * Captor utils functions
   * ======================
   */

  /**
   * Extract the local X and Y coordinates from a mouse event or touch object. If
   * a DOM element is given, it uses this element's offset to compute the position
   * (this allows using events that are not bound to the container itself and
   * still have a proper position).
   *
   * @param  {event}       e - A mouse event or touch object.
   * @param  {HTMLElement} dom - A DOM element to compute offset relatively to.
   * @return {number}      The local Y value of the mouse.
   */
  function getPosition(e, dom) {
    var bbox = dom.getBoundingClientRect();
    return {
      x: e.clientX - bbox.left,
      y: e.clientY - bbox.top
    };
  }

  /**
   * Convert mouse coords to sigma coords.
   *
   * @param  {event}       e   - A mouse event or touch object.
   * @param  {HTMLElement} dom - A DOM element to compute offset relatively to.
   * @return {object}
   */
  function getMouseCoords(e, dom) {
    var res = _objectSpread2(_objectSpread2({}, getPosition(e, dom)), {}, {
      sigmaDefaultPrevented: false,
      preventSigmaDefault: function preventSigmaDefault() {
        res.sigmaDefaultPrevented = true;
      },
      original: e
    });
    return res;
  }

  /**
   * Takes a touch coords or a mouse coords, and always returns a clean mouse coords object.
   */
  function cleanMouseCoords(e) {
    var res = "x" in e ? e : _objectSpread2(_objectSpread2({}, e.touches[0] || e.previousTouches[0]), {}, {
      original: e.original,
      sigmaDefaultPrevented: e.sigmaDefaultPrevented,
      preventSigmaDefault: function preventSigmaDefault() {
        e.sigmaDefaultPrevented = true;
        res.sigmaDefaultPrevented = true;
      }
    });
    return res;
  }

  /**
   * Convert mouse wheel event coords to sigma coords.
   *
   * @param  {event}       e   - A wheel mouse event.
   * @param  {HTMLElement} dom - A DOM element to compute offset relatively to.
   * @return {object}
   */
  function getWheelCoords(e, dom) {
    return _objectSpread2(_objectSpread2({}, getMouseCoords(e, dom)), {}, {
      delta: getWheelDelta(e)
    });
  }
  var MAX_TOUCHES = 2;
  function getTouchesArray(touches) {
    var arr = [];
    for (var i = 0, l = Math.min(touches.length, MAX_TOUCHES); i < l; i++) arr.push(touches[i]);
    return arr;
  }

  /**
   * Convert touch coords to sigma coords.
   *
   * @param  {event}       e               - A touch event.
   * @param  {Touch[]}     previousTouches - An array of the previously stored touches.
   * @param  {HTMLElement} dom             - A DOM element to compute offset relatively to.
   * @return {object}
   */
  function getTouchCoords(e, previousTouches, dom) {
    var res = {
      touches: getTouchesArray(e.touches).map(function (touch) {
        return getPosition(touch, dom);
      }),
      previousTouches: previousTouches.map(function (touch) {
        return getPosition(touch, dom);
      }),
      sigmaDefaultPrevented: false,
      preventSigmaDefault: function preventSigmaDefault() {
        res.sigmaDefaultPrevented = true;
      },
      original: e
    };
    return res;
  }

  /**
   * Extract the wheel delta from a mouse event or touch object.
   *
   * @param  {event}  e - A mouse event or touch object.
   * @return {number}     The wheel delta of the mouse.
   */
  function getWheelDelta(e) {
    // TODO: check those ratios again to ensure a clean Chrome/Firefox compat
    if (typeof e.deltaY !== "undefined") return e.deltaY * -3 / 360;
    if (typeof e.detail !== "undefined") return e.detail / -9;
    throw new Error("Captor: could not extract delta from event.");
  }

  /**
   * Abstract class representing a captor like the user's mouse or touch controls.
   */
  var Captor = /*#__PURE__*/function (_TypedEventEmitter) {
    function Captor(container, renderer) {
      var _this;
      _classCallCheck(this, Captor);
      _this = _callSuper(this, Captor);
      // Properties
      _this.container = container;
      _this.renderer = renderer;
      return _this;
    }
    _inherits(Captor, _TypedEventEmitter);
    return _createClass(Captor);
  }(TypedEventEmitter);

  var MOUSE_SETTINGS_KEYS = ["doubleClickTimeout", "doubleClickZoomingDuration", "doubleClickZoomingRatio", "dragTimeout", "draggedEventsTolerance", "inertiaDuration", "inertiaRatio", "zoomDuration", "zoomingRatio"];
  var DEFAULT_MOUSE_SETTINGS = MOUSE_SETTINGS_KEYS.reduce(function (iter, key) {
    return _objectSpread2(_objectSpread2({}, iter), {}, _defineProperty({}, key, DEFAULT_SETTINGS[key]));
  }, {});

  /**
   * Event types.
   */
  /**
   * Mouse captor class.
   *
   * @constructor
   */
  var MouseCaptor = /*#__PURE__*/function (_Captor) {
    function MouseCaptor(container, renderer) {
      var _this;
      _classCallCheck(this, MouseCaptor);
      _this = _callSuper(this, MouseCaptor, [container, renderer]);

      // Binding methods
      // State
      _defineProperty(_this, "enabled", true);
      _defineProperty(_this, "draggedEvents", 0);
      _defineProperty(_this, "downStartTime", null);
      _defineProperty(_this, "lastMouseX", null);
      _defineProperty(_this, "lastMouseY", null);
      _defineProperty(_this, "isMouseDown", false);
      _defineProperty(_this, "isMoving", false);
      _defineProperty(_this, "movingTimeout", null);
      _defineProperty(_this, "startCameraState", null);
      _defineProperty(_this, "clicks", 0);
      _defineProperty(_this, "doubleClickTimeout", null);
      _defineProperty(_this, "currentWheelDirection", 0);
      _defineProperty(_this, "settings", DEFAULT_MOUSE_SETTINGS);
      _this.handleClick = _this.handleClick.bind(_this);
      _this.handleRightClick = _this.handleRightClick.bind(_this);
      _this.handleDown = _this.handleDown.bind(_this);
      _this.handleUp = _this.handleUp.bind(_this);
      _this.handleMove = _this.handleMove.bind(_this);
      _this.handleWheel = _this.handleWheel.bind(_this);
      _this.handleLeave = _this.handleLeave.bind(_this);
      _this.handleEnter = _this.handleEnter.bind(_this);

      // Binding events
      container.addEventListener("click", _this.handleClick, {
        capture: false
      });
      container.addEventListener("contextmenu", _this.handleRightClick, {
        capture: false
      });
      container.addEventListener("mousedown", _this.handleDown, {
        capture: false
      });
      container.addEventListener("wheel", _this.handleWheel, {
        capture: false
      });
      container.addEventListener("mouseleave", _this.handleLeave, {
        capture: false
      });
      container.addEventListener("mouseenter", _this.handleEnter, {
        capture: false
      });
      document.addEventListener("mousemove", _this.handleMove, {
        capture: false
      });
      document.addEventListener("mouseup", _this.handleUp, {
        capture: false
      });
      return _this;
    }
    _inherits(MouseCaptor, _Captor);
    return _createClass(MouseCaptor, [{
      key: "kill",
      value: function kill() {
        var container = this.container;
        container.removeEventListener("click", this.handleClick);
        container.removeEventListener("contextmenu", this.handleRightClick);
        container.removeEventListener("mousedown", this.handleDown);
        container.removeEventListener("wheel", this.handleWheel);
        container.removeEventListener("mouseleave", this.handleLeave);
        container.removeEventListener("mouseenter", this.handleEnter);
        document.removeEventListener("mousemove", this.handleMove);
        document.removeEventListener("mouseup", this.handleUp);
      }
    }, {
      key: "handleClick",
      value: function handleClick(e) {
        var _this2 = this;
        if (!this.enabled) return;
        this.clicks++;
        if (this.clicks === 2) {
          this.clicks = 0;
          if (typeof this.doubleClickTimeout === "number") {
            clearTimeout(this.doubleClickTimeout);
            this.doubleClickTimeout = null;
          }
          return this.handleDoubleClick(e);
        }
        setTimeout(function () {
          _this2.clicks = 0;
          _this2.doubleClickTimeout = null;
        }, this.settings.doubleClickTimeout);

        // NOTE: this is here to prevent click events on drag
        if (this.draggedEvents < this.settings.draggedEventsTolerance) this.emit("click", getMouseCoords(e, this.container));
      }
    }, {
      key: "handleRightClick",
      value: function handleRightClick(e) {
        if (!this.enabled) return;
        this.emit("rightClick", getMouseCoords(e, this.container));
      }
    }, {
      key: "handleDoubleClick",
      value: function handleDoubleClick(e) {
        if (!this.enabled) return;
        e.preventDefault();
        e.stopPropagation();
        var mouseCoords = getMouseCoords(e, this.container);
        this.emit("doubleClick", mouseCoords);
        if (mouseCoords.sigmaDefaultPrevented) return;

        // default behavior
        var camera = this.renderer.getCamera();
        var newRatio = camera.getBoundedRatio(camera.getState().ratio / this.settings.doubleClickZoomingRatio);
        camera.animate(this.renderer.getViewportZoomedState(getPosition(e, this.container), newRatio), {
          easing: "quadraticInOut",
          duration: this.settings.doubleClickZoomingDuration
        });
      }
    }, {
      key: "handleDown",
      value: function handleDown(e) {
        if (!this.enabled) return;

        // We only start dragging on left button
        if (e.button === 0) {
          this.startCameraState = this.renderer.getCamera().getState();
          var _getPosition = getPosition(e, this.container),
            x = _getPosition.x,
            y = _getPosition.y;
          this.lastMouseX = x;
          this.lastMouseY = y;
          this.draggedEvents = 0;
          this.downStartTime = Date.now();
          this.isMouseDown = true;
        }
        this.emit("mousedown", getMouseCoords(e, this.container));
      }
    }, {
      key: "handleUp",
      value: function handleUp(e) {
        var _this3 = this;
        if (!this.enabled || !this.isMouseDown) return;
        var camera = this.renderer.getCamera();
        this.isMouseDown = false;
        if (typeof this.movingTimeout === "number") {
          clearTimeout(this.movingTimeout);
          this.movingTimeout = null;
        }
        var _getPosition2 = getPosition(e, this.container),
          x = _getPosition2.x,
          y = _getPosition2.y;
        var cameraState = camera.getState(),
          previousCameraState = camera.getPreviousState() || {
            x: 0,
            y: 0
          };
        if (this.isMoving) {
          camera.animate({
            x: cameraState.x + this.settings.inertiaRatio * (cameraState.x - previousCameraState.x),
            y: cameraState.y + this.settings.inertiaRatio * (cameraState.y - previousCameraState.y)
          }, {
            duration: this.settings.inertiaDuration,
            easing: "quadraticOut"
          });
        } else if (this.lastMouseX !== x || this.lastMouseY !== y) {
          camera.setState({
            x: cameraState.x,
            y: cameraState.y
          });
        }
        this.isMoving = false;
        setTimeout(function () {
          var shouldRefresh = _this3.draggedEvents > 0;
          _this3.draggedEvents = 0;

          // NOTE: this refresh is here to make sure `hideEdgesOnMove` can work
          // when someone releases camera pan drag after having stopped moving.
          // See commit: https://github.com/jacomyal/sigma.js/commit/cfd9197f70319109db6b675dd7c82be493ca95a2
          // See also issue: https://github.com/jacomyal/sigma.js/issues/1290
          // It could be possible to render instead of scheduling a refresh but for
          // now it seems good enough.
          if (shouldRefresh && _this3.renderer.getSetting("hideEdgesOnMove")) _this3.renderer.refresh();
        }, 0);
        this.emit("mouseup", getMouseCoords(e, this.container));
      }
    }, {
      key: "handleMove",
      value: function handleMove(e) {
        var _this4 = this;
        if (!this.enabled) return;
        var mouseCoords = getMouseCoords(e, this.container);

        // Always trigger a "mousemovebody" event, so that it is possible to develop
        // a drag-and-drop effect that works even when the mouse is out of the
        // container:
        this.emit("mousemovebody", mouseCoords);

        // Only trigger the "mousemove" event when the mouse is actually hovering
        // the container, to avoid weirdly hovering nodes and/or edges when the
        // mouse is not hover the container:
        if (e.target === this.container || e.composedPath()[0] === this.container) {
          this.emit("mousemove", mouseCoords);
        }
        if (mouseCoords.sigmaDefaultPrevented) return;

        // Handle the case when "isMouseDown" all the time, to allow dragging the
        // stage while the mouse is not hover the container:
        if (this.isMouseDown) {
          this.isMoving = true;
          this.draggedEvents++;
          if (typeof this.movingTimeout === "number") {
            clearTimeout(this.movingTimeout);
          }
          this.movingTimeout = window.setTimeout(function () {
            _this4.movingTimeout = null;
            _this4.isMoving = false;
          }, this.settings.dragTimeout);
          var camera = this.renderer.getCamera();
          var _getPosition3 = getPosition(e, this.container),
            eX = _getPosition3.x,
            eY = _getPosition3.y;
          var lastMouse = this.renderer.viewportToFramedGraph({
            x: this.lastMouseX,
            y: this.lastMouseY
          });
          var mouse = this.renderer.viewportToFramedGraph({
            x: eX,
            y: eY
          });
          var offsetX = lastMouse.x - mouse.x,
            offsetY = lastMouse.y - mouse.y;
          var cameraState = camera.getState();
          var x = cameraState.x + offsetX,
            y = cameraState.y + offsetY;
          camera.setState({
            x: x,
            y: y
          });
          this.lastMouseX = eX;
          this.lastMouseY = eY;
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }, {
      key: "handleLeave",
      value: function handleLeave(e) {
        this.emit("mouseleave", getMouseCoords(e, this.container));
      }
    }, {
      key: "handleEnter",
      value: function handleEnter(e) {
        this.emit("mouseenter", getMouseCoords(e, this.container));
      }
    }, {
      key: "handleWheel",
      value: function handleWheel(e) {
        var _this5 = this;
        var camera = this.renderer.getCamera();
        if (!this.enabled || !camera.enabledZooming) return;
        var delta = getWheelDelta(e);
        if (!delta) return;
        var wheelCoords = getWheelCoords(e, this.container);
        this.emit("wheel", wheelCoords);
        if (wheelCoords.sigmaDefaultPrevented) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // Default behavior
        var currentRatio = camera.getState().ratio;
        var ratioDiff = delta > 0 ? 1 / this.settings.zoomingRatio : this.settings.zoomingRatio;
        var newRatio = camera.getBoundedRatio(currentRatio * ratioDiff);
        var wheelDirection = delta > 0 ? 1 : -1;
        var now = Date.now();

        // Exit early without preventing default behavior when ratio doesn't change:
        if (currentRatio === newRatio) return;
        e.preventDefault();
        e.stopPropagation();

        // Cancel events that are too close each other and in the same direction:
        if (this.currentWheelDirection === wheelDirection && this.lastWheelTriggerTime && now - this.lastWheelTriggerTime < this.settings.zoomDuration / 5) {
          return;
        }
        camera.animate(this.renderer.getViewportZoomedState(getPosition(e, this.container), newRatio), {
          easing: "quadraticOut",
          duration: this.settings.zoomDuration
        }, function () {
          _this5.currentWheelDirection = 0;
        });
        this.currentWheelDirection = wheelDirection;
        this.lastWheelTriggerTime = now;
      }
    }, {
      key: "setSettings",
      value: function setSettings(settings) {
        this.settings = settings;
      }
    }]);
  }(Captor);

  var TOUCH_SETTINGS_KEYS = ["dragTimeout", "inertiaDuration", "inertiaRatio", "doubleClickTimeout", "doubleClickZoomingRatio", "doubleClickZoomingDuration", "tapMoveTolerance"];
  var DEFAULT_TOUCH_SETTINGS = TOUCH_SETTINGS_KEYS.reduce(function (iter, key) {
    return _objectSpread2(_objectSpread2({}, iter), {}, _defineProperty({}, key, DEFAULT_SETTINGS[key]));
  }, {});

  /**
   * Event types.
   */
  /**
   * Touch captor class.
   *
   * @constructor
   */
  var TouchCaptor = /*#__PURE__*/function (_Captor) {
    function TouchCaptor(container, renderer) {
      var _this;
      _classCallCheck(this, TouchCaptor);
      _this = _callSuper(this, TouchCaptor, [container, renderer]);

      // Binding methods:
      _defineProperty(_this, "enabled", true);
      _defineProperty(_this, "isMoving", false);
      _defineProperty(_this, "hasMoved", false);
      _defineProperty(_this, "touchMode", 0);
      _defineProperty(_this, "startTouchesPositions", []);
      _defineProperty(_this, "lastTouches", []);
      _defineProperty(_this, "lastTap", null);
      _defineProperty(_this, "settings", DEFAULT_TOUCH_SETTINGS);
      _this.handleStart = _this.handleStart.bind(_this);
      _this.handleLeave = _this.handleLeave.bind(_this);
      _this.handleMove = _this.handleMove.bind(_this);

      // Binding events
      container.addEventListener("touchstart", _this.handleStart, {
        capture: false
      });
      container.addEventListener("touchcancel", _this.handleLeave, {
        capture: false
      });
      document.addEventListener("touchend", _this.handleLeave, {
        capture: false,
        passive: false
      });
      document.addEventListener("touchmove", _this.handleMove, {
        capture: false,
        passive: false
      });
      return _this;
    }
    _inherits(TouchCaptor, _Captor);
    return _createClass(TouchCaptor, [{
      key: "kill",
      value: function kill() {
        var container = this.container;
        container.removeEventListener("touchstart", this.handleStart);
        container.removeEventListener("touchcancel", this.handleLeave);
        document.removeEventListener("touchend", this.handleLeave);
        document.removeEventListener("touchmove", this.handleMove);
      }
    }, {
      key: "getDimensions",
      value: function getDimensions() {
        return {
          width: this.container.offsetWidth,
          height: this.container.offsetHeight
        };
      }
    }, {
      key: "handleStart",
      value: function handleStart(e) {
        var _this2 = this;
        if (!this.enabled) return;
        e.preventDefault();
        var touches = getTouchesArray(e.touches);
        this.touchMode = touches.length;
        this.startCameraState = this.renderer.getCamera().getState();
        this.startTouchesPositions = touches.map(function (touch) {
          return getPosition(touch, _this2.container);
        });

        // When there are two touches down, let's record distance and angle as well:
        if (this.touchMode === 2) {
          var _this$startTouchesPos = _slicedToArray(this.startTouchesPositions, 2),
            _this$startTouchesPos2 = _this$startTouchesPos[0],
            x0 = _this$startTouchesPos2.x,
            y0 = _this$startTouchesPos2.y,
            _this$startTouchesPos3 = _this$startTouchesPos[1],
            x1 = _this$startTouchesPos3.x,
            y1 = _this$startTouchesPos3.y;
          this.startTouchesAngle = Math.atan2(y1 - y0, x1 - x0);
          this.startTouchesDistance = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
        }
        this.emit("touchdown", getTouchCoords(e, this.lastTouches, this.container));
        this.lastTouches = touches;
        this.lastTouchesPositions = this.startTouchesPositions;
      }
    }, {
      key: "handleLeave",
      value: function handleLeave(e) {
        if (!this.enabled || !this.startTouchesPositions.length) return;
        if (e.cancelable) e.preventDefault();
        if (this.movingTimeout) {
          this.isMoving = false;
          clearTimeout(this.movingTimeout);
        }
        switch (this.touchMode) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          case 2:
            if (e.touches.length === 1) {
              this.handleStart(e);
              e.preventDefault();
              break;
            }
          /* falls through */
          case 1:
            if (this.isMoving) {
              var camera = this.renderer.getCamera();
              var cameraState = camera.getState(),
                previousCameraState = camera.getPreviousState() || {
                  x: 0,
                  y: 0
                };
              camera.animate({
                x: cameraState.x + this.settings.inertiaRatio * (cameraState.x - previousCameraState.x),
                y: cameraState.y + this.settings.inertiaRatio * (cameraState.y - previousCameraState.y)
              }, {
                duration: this.settings.inertiaDuration,
                easing: "quadraticOut"
              });
            }
            this.hasMoved = false;
            this.isMoving = false;
            this.touchMode = 0;
            break;
        }
        this.emit("touchup", getTouchCoords(e, this.lastTouches, this.container));

        // When the last touch ends and there hasn't been too much movement, trigger a "tap" or "doubletap" event:
        if (!e.touches.length) {
          var position = getPosition(this.lastTouches[0], this.container);
          var downPosition = this.startTouchesPositions[0];
          var dSquare = Math.pow(position.x - downPosition.x, 2) + Math.pow(position.y - downPosition.y, 2);
          if (!e.touches.length && dSquare < Math.pow(this.settings.tapMoveTolerance, 2)) {
            // Only trigger "doubletap" when the last tap is recent enough:
            if (this.lastTap && Date.now() - this.lastTap.time < this.settings.doubleClickTimeout) {
              var touchCoords = getTouchCoords(e, this.lastTouches, this.container);
              this.emit("doubletap", touchCoords);
              this.lastTap = null;
              if (!touchCoords.sigmaDefaultPrevented) {
                var _camera = this.renderer.getCamera();
                var newRatio = _camera.getBoundedRatio(_camera.getState().ratio / this.settings.doubleClickZoomingRatio);
                _camera.animate(this.renderer.getViewportZoomedState(position, newRatio), {
                  easing: "quadraticInOut",
                  duration: this.settings.doubleClickZoomingDuration
                });
              }
            }
            // Else, trigger a normal "tap" event:
            else {
              var _touchCoords = getTouchCoords(e, this.lastTouches, this.container);
              this.emit("tap", _touchCoords);
              this.lastTap = {
                time: Date.now(),
                position: _touchCoords.touches[0] || _touchCoords.previousTouches[0]
              };
            }
          }
        }
        this.lastTouches = getTouchesArray(e.touches);
        this.startTouchesPositions = [];
      }
    }, {
      key: "handleMove",
      value: function handleMove(e) {
        var _this3 = this;
        if (!this.enabled || !this.startTouchesPositions.length) return;
        e.preventDefault();
        var touches = getTouchesArray(e.touches);
        var touchesPositions = touches.map(function (touch) {
          return getPosition(touch, _this3.container);
        });
        var lastTouches = this.lastTouches;
        this.lastTouches = touches;
        this.lastTouchesPositions = touchesPositions;
        var touchCoords = getTouchCoords(e, lastTouches, this.container);
        this.emit("touchmove", touchCoords);
        if (touchCoords.sigmaDefaultPrevented) return;

        // If a move was initiated at some point, and we get back to start point,
        // we should still consider that we did move (which also happens after a
        // multiple touch when only one touch remains in which case handleStart
        // is recalled within handleLeave).
        // Now, some mobile browsers report zero-distance moves so we also check that
        // one of the touches did actually move from the origin position.
        this.hasMoved || (this.hasMoved = touchesPositions.some(function (position, idx) {
          var startPosition = _this3.startTouchesPositions[idx];
          return startPosition && (position.x !== startPosition.x || position.y !== startPosition.y);
        }));

        // If there was no move, do not trigger touch moves behavior
        if (!this.hasMoved) {
          return;
        }
        this.isMoving = true;
        if (this.movingTimeout) clearTimeout(this.movingTimeout);
        this.movingTimeout = window.setTimeout(function () {
          _this3.isMoving = false;
        }, this.settings.dragTimeout);
        var camera = this.renderer.getCamera();
        var startCameraState = this.startCameraState;
        var padding = this.renderer.getSetting("stagePadding");
        switch (this.touchMode) {
          case 1:
            {
              var _this$renderer$viewpo = this.renderer.viewportToFramedGraph((this.startTouchesPositions || [])[0]),
                xStart = _this$renderer$viewpo.x,
                yStart = _this$renderer$viewpo.y;
              var _this$renderer$viewpo2 = this.renderer.viewportToFramedGraph(touchesPositions[0]),
                x = _this$renderer$viewpo2.x,
                y = _this$renderer$viewpo2.y;
              camera.setState({
                x: startCameraState.x + xStart - x,
                y: startCameraState.y + yStart - y
              });
              break;
            }
          case 2:
            {
              /**
               * Here is the thinking here:
               *
               * 1. We can find the new angle and ratio, by comparing the vector from "touch one" to "touch two" at the start
               *    of the d'n'd and now
               *
               * 2. We can use `Camera#viewportToGraph` inside formula to retrieve the new camera position, using the graph
               *    position of a touch at the beginning of the d'n'd (using `startCamera.viewportToGraph`) and the viewport
               *    position of this same touch now
               */
              var newCameraState = {
                x: 0.5,
                y: 0.5,
                angle: 0,
                ratio: 1
              };
              var _touchesPositions$ = touchesPositions[0],
                x0 = _touchesPositions$.x,
                y0 = _touchesPositions$.y;
              var _touchesPositions$2 = touchesPositions[1],
                x1 = _touchesPositions$2.x,
                y1 = _touchesPositions$2.y;
              var angleDiff = Math.atan2(y1 - y0, x1 - x0) - this.startTouchesAngle;
              var ratioDiff = Math.hypot(y1 - y0, x1 - x0) / this.startTouchesDistance;

              // 1.
              var newRatio = camera.getBoundedRatio(startCameraState.ratio / ratioDiff);
              newCameraState.ratio = newRatio;
              newCameraState.angle = startCameraState.angle + angleDiff;

              // 2.
              var dimensions = this.getDimensions();
              var touchGraphPosition = this.renderer.viewportToFramedGraph((this.startTouchesPositions || [])[0], {
                cameraState: startCameraState
              });
              var smallestDimension = Math.min(dimensions.width, dimensions.height) - 2 * padding;
              var dx = smallestDimension / dimensions.width;
              var dy = smallestDimension / dimensions.height;
              var ratio = newRatio / smallestDimension;

              // Align with center of the graph:
              var _x = x0 - smallestDimension / 2 / dx;
              var _y = y0 - smallestDimension / 2 / dy;

              // Rotate:
              var _ref = [_x * Math.cos(-newCameraState.angle) - _y * Math.sin(-newCameraState.angle), _y * Math.cos(-newCameraState.angle) + _x * Math.sin(-newCameraState.angle)];
              _x = _ref[0];
              _y = _ref[1];
              newCameraState.x = touchGraphPosition.x - _x * ratio;
              newCameraState.y = touchGraphPosition.y + _y * ratio;
              camera.setState(newCameraState);
              break;
            }
        }
      }
    }, {
      key: "setSettings",
      value: function setSettings(settings) {
        this.settings = settings;
      }
    }]);
  }(Captor);

  function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) return _arrayLikeToArray(r);
  }

  function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function _toConsumableArray(r) {
    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
  }

  function _objectWithoutPropertiesLoose(r, e) {
    if (null == r) return {};
    var t = {};
    for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
      if (-1 !== e.indexOf(n)) continue;
      t[n] = r[n];
    }
    return t;
  }

  function _objectWithoutProperties(e, t) {
    if (null == e) return {};
    var o,
      r,
      i = _objectWithoutPropertiesLoose(e, t);
    if (Object.getOwnPropertySymbols) {
      var n = Object.getOwnPropertySymbols(e);
      for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
    }
    return i;
  }

  /**
   * Sigma.js Labels Heuristics
   * ===========================
   *
   * Miscellaneous heuristics related to label display.
   * @module
   */
  /**
   * Class representing a single candidate for the label grid selection.
   *
   * It also describes a deterministic way to compare two candidates to assess
   * which one is better.
   */
  var LabelCandidate = /*#__PURE__*/function () {
    function LabelCandidate(key, size) {
      _classCallCheck(this, LabelCandidate);
      this.key = key;
      this.size = size;
    }
    return _createClass(LabelCandidate, null, [{
      key: "compare",
      value: function compare(first, second) {
        // First we compare by size
        if (first.size > second.size) return -1;
        if (first.size < second.size) return 1;

        // Then since no two nodes can have the same key, we use it to
        // deterministically tie-break by key
        if (first.key > second.key) return 1;

        // NOTE: this comparator cannot return 0
        return -1;
      }
    }]);
  }();
  /**
   * Class representing a 2D spatial grid divided into constant-size cells.
   */
  var LabelGrid = /*#__PURE__*/function () {
    function LabelGrid() {
      _classCallCheck(this, LabelGrid);
      _defineProperty(this, "width", 0);
      _defineProperty(this, "height", 0);
      _defineProperty(this, "cellSize", 0);
      _defineProperty(this, "columns", 0);
      _defineProperty(this, "rows", 0);
      _defineProperty(this, "cells", {});
    }
    return _createClass(LabelGrid, [{
      key: "resizeAndClear",
      value: function resizeAndClear(dimensions, cellSize) {
        this.width = dimensions.width;
        this.height = dimensions.height;
        this.cellSize = cellSize;
        this.columns = Math.ceil(dimensions.width / cellSize);
        this.rows = Math.ceil(dimensions.height / cellSize);
        this.cells = {};
      }
    }, {
      key: "getIndex",
      value: function getIndex(pos) {
        var xIndex = Math.floor(pos.x / this.cellSize);
        var yIndex = Math.floor(pos.y / this.cellSize);
        return yIndex * this.columns + xIndex;
      }
    }, {
      key: "add",
      value: function add(key, size, pos) {
        var candidate = new LabelCandidate(key, size);
        var index = this.getIndex(pos);
        var cell = this.cells[index];
        if (!cell) {
          cell = [];
          this.cells[index] = cell;
        }
        cell.push(candidate);
      }
    }, {
      key: "organize",
      value: function organize() {
        for (var k in this.cells) {
          var cell = this.cells[k];
          cell.sort(LabelCandidate.compare);
        }
      }
    }, {
      key: "getLabelsToDisplay",
      value: function getLabelsToDisplay(ratio, density) {
        // TODO: work on visible nodes to optimize? ^ -> threshold outside so that memoization works?
        // TODO: adjust threshold lower, but increase cells a bit?
        // TODO: hunt for geom issue in disguise
        // TODO: memoize while ratio does not move. method to force recompute
        var cellArea = this.cellSize * this.cellSize;
        var scaledCellArea = cellArea / ratio / ratio;
        var scaledDensity = scaledCellArea * density / cellArea;
        var labelsToDisplayPerCell = Math.ceil(scaledDensity);
        var labels = [];
        for (var k in this.cells) {
          var cell = this.cells[k];
          for (var i = 0; i < Math.min(labelsToDisplayPerCell, cell.length); i++) {
            labels.push(cell[i].key);
          }
        }
        return labels;
      }
    }]);
  }();

  /**
   * Label heuristic selecting edge labels to display, based on displayed node
   * labels
   *
   * @param  {object} params                 - Parameters:
   * @param  {Set}      displayedNodeLabels  - Currently displayed node labels.
   * @param  {Set}      highlightedNodes     - Highlighted nodes.
   * @param  {Graph}    graph                - The rendered graph.
   * @param  {string}   hoveredNode          - Hovered node (optional)
   * @return {Array}                         - The selected labels.
   */
  function edgeLabelsToDisplayFromNodes(params) {
    var graph = params.graph,
      hoveredNode = params.hoveredNode,
      highlightedNodes = params.highlightedNodes,
      displayedNodeLabels = params.displayedNodeLabels;
    var worthyEdges = [];

    // TODO: the code below can be optimized using #.forEach and batching the code per adj

    // We should display an edge's label if:
    //   - Any of its extremities is highlighted or hovered
    //   - Both of its extremities has its label shown
    graph.forEachEdge(function (edge, _, source, target) {
      if (source === hoveredNode || target === hoveredNode || highlightedNodes.has(source) || highlightedNodes.has(target) || displayedNodeLabels.has(source) && displayedNodeLabels.has(target)) {
        worthyEdges.push(edge);
      }
    });
    return worthyEdges;
  }

  /**
   * Constants.
   */
  var X_LABEL_MARGIN = 150;
  var Y_LABEL_MARGIN = 50;
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  /**
   * Important functions.
   */
  function applyNodeDefaults(settings, key, data) {
    if (!hasOwnProperty.call(data, "x") || !hasOwnProperty.call(data, "y")) throw new Error("Sigma: could not find a valid position (x, y) for node \"".concat(key, "\". All your nodes must have a number \"x\" and \"y\". Maybe your forgot to apply a layout or your \"nodeReducer\" is not returning the correct data?"));
    if (!data.color) data.color = settings.defaultNodeColor;
    if (!data.label && data.label !== "") data.label = null;
    if (data.label !== undefined && data.label !== null) data.label = "" + data.label;else data.label = null;
    if (!data.size) data.size = 2;
    if (!hasOwnProperty.call(data, "hidden")) data.hidden = false;
    if (!hasOwnProperty.call(data, "highlighted")) data.highlighted = false;
    if (!hasOwnProperty.call(data, "forceLabel")) data.forceLabel = false;
    if (!data.type || data.type === "") data.type = settings.defaultNodeType;
    if (!data.zIndex) data.zIndex = 0;
    return data;
  }
  function applyEdgeDefaults(settings, _key, data) {
    if (!data.color) data.color = settings.defaultEdgeColor;
    if (!data.label) data.label = "";
    if (!data.size) data.size = 0.5;
    if (!hasOwnProperty.call(data, "hidden")) data.hidden = false;
    if (!hasOwnProperty.call(data, "forceLabel")) data.forceLabel = false;
    if (!data.type || data.type === "") data.type = settings.defaultEdgeType;
    if (!data.zIndex) data.zIndex = 0;
    return data;
  }

  /**
   * Main class.
   *
   * @constructor
   * @param {Graph}       graph     - Graph to render.
   * @param {HTMLElement} container - DOM container in which to render.
   * @param {object}      settings  - Optional settings.
   */
  var Sigma$1 = /*#__PURE__*/function (_TypedEventEmitter) {
    function Sigma(graph, container) {
      var _this;
      var settings = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      _classCallCheck(this, Sigma);
      _this = _callSuper(this, Sigma);

      // Resolving settings
      _defineProperty(_this, "elements", {});
      _defineProperty(_this, "canvasContexts", {});
      _defineProperty(_this, "webGLContexts", {});
      _defineProperty(_this, "pickingLayers", new Set());
      _defineProperty(_this, "textures", {});
      _defineProperty(_this, "frameBuffers", {});
      _defineProperty(_this, "activeListeners", {});
      _defineProperty(_this, "labelGrid", new LabelGrid());
      _defineProperty(_this, "nodeDataCache", {});
      _defineProperty(_this, "edgeDataCache", {});
      // Indices to keep track of the index of the item inside programs
      _defineProperty(_this, "nodeProgramIndex", {});
      _defineProperty(_this, "edgeProgramIndex", {});
      _defineProperty(_this, "nodesWithForcedLabels", new Set());
      _defineProperty(_this, "edgesWithForcedLabels", new Set());
      _defineProperty(_this, "nodeExtent", {
        x: [0, 1],
        y: [0, 1]
      });
      _defineProperty(_this, "nodeZExtent", [Infinity, -Infinity]);
      _defineProperty(_this, "edgeZExtent", [Infinity, -Infinity]);
      _defineProperty(_this, "matrix", identity());
      _defineProperty(_this, "invMatrix", identity());
      _defineProperty(_this, "correctionRatio", 1);
      _defineProperty(_this, "customBBox", null);
      _defineProperty(_this, "normalizationFunction", createNormalizationFunction({
        x: [0, 1],
        y: [0, 1]
      }));
      // Cache:
      _defineProperty(_this, "graphToViewportRatio", 1);
      _defineProperty(_this, "itemIDsIndex", {});
      _defineProperty(_this, "nodeIndices", {});
      _defineProperty(_this, "edgeIndices", {});
      // Starting dimensions and pixel ratio
      _defineProperty(_this, "width", 0);
      _defineProperty(_this, "height", 0);
      _defineProperty(_this, "pixelRatio", getPixelRatio());
      _defineProperty(_this, "pickingDownSizingRatio", 2 * _this.pixelRatio);
      // Graph State
      _defineProperty(_this, "displayedNodeLabels", new Set());
      _defineProperty(_this, "displayedEdgeLabels", new Set());
      _defineProperty(_this, "highlightedNodes", new Set());
      _defineProperty(_this, "hoveredNode", null);
      _defineProperty(_this, "hoveredEdge", null);
      // Internal states
      _defineProperty(_this, "renderFrame", null);
      _defineProperty(_this, "renderHighlightedNodesFrame", null);
      _defineProperty(_this, "needToProcess", false);
      _defineProperty(_this, "checkEdgesEventsFrame", null);
      // Programs
      _defineProperty(_this, "nodePrograms", {});
      _defineProperty(_this, "nodeHoverPrograms", {});
      _defineProperty(_this, "edgePrograms", {});
      _this.settings = resolveSettings(settings);

      // Validating
      validateSettings(_this.settings);
      validateGraph(graph);
      if (!(container instanceof HTMLElement)) throw new Error("Sigma: container should be an html element.");

      // Properties
      _this.graph = graph;
      _this.container = container;

      // Initializing contexts
      _this.createWebGLContext("edges", {
        picking: settings.enableEdgeEvents
      });
      _this.createCanvasContext("edgeLabels");
      _this.createWebGLContext("nodes", {
        picking: true
      });
      _this.createCanvasContext("labels");
      _this.createCanvasContext("hovers");
      _this.createWebGLContext("hoverNodes");
      _this.createCanvasContext("mouse", {
        style: {
          touchAction: "none",
          userSelect: "none"
        }
      });

      // Initial resize
      _this.resize();

      // Loading programs
      for (var type in _this.settings.nodeProgramClasses) {
        _this.registerNodeProgram(type, _this.settings.nodeProgramClasses[type], _this.settings.nodeHoverProgramClasses[type]);
      }
      for (var _type in _this.settings.edgeProgramClasses) {
        _this.registerEdgeProgram(_type, _this.settings.edgeProgramClasses[_type]);
      }

      // Initializing the camera
      _this.camera = new Camera();

      // Binding camera events
      _this.bindCameraHandlers();

      // Initializing captors
      _this.mouseCaptor = new MouseCaptor(_this.elements.mouse, _this);
      _this.mouseCaptor.setSettings(_this.settings);
      _this.touchCaptor = new TouchCaptor(_this.elements.mouse, _this);
      _this.touchCaptor.setSettings(_this.settings);

      // Binding event handlers
      _this.bindEventHandlers();

      // Binding graph handlers
      _this.bindGraphHandlers();

      // Trigger eventual settings-related things
      _this.handleSettingsUpdate();

      // Processing data for the first time & render
      _this.refresh();
      return _this;
    }

    /**---------------------------------------------------------------------------
     * Internal methods.
     **---------------------------------------------------------------------------
     */

    /**
     * Internal function used to register a node program
     *
     * @param  {string}           key              - The program's key, matching the related nodes "type" values.
     * @param  {NodeProgramType}  NodeProgramClass - A nodes program class.
     * @param  {NodeProgramType?} NodeHoverProgram - A nodes program class to render hovered nodes (optional).
     * @return {Sigma}
     */
    _inherits(Sigma, _TypedEventEmitter);
    return _createClass(Sigma, [{
      key: "registerNodeProgram",
      value: function registerNodeProgram(key, NodeProgramClass, NodeHoverProgram) {
        if (this.nodePrograms[key]) this.nodePrograms[key].kill();
        if (this.nodeHoverPrograms[key]) this.nodeHoverPrograms[key].kill();
        this.nodePrograms[key] = new NodeProgramClass(this.webGLContexts.nodes, this.frameBuffers.nodes, this);
        this.nodeHoverPrograms[key] = new (NodeHoverProgram || NodeProgramClass)(this.webGLContexts.hoverNodes, null, this);
        return this;
      }

      /**
       * Internal function used to register an edge program
       *
       * @param  {string}          key              - The program's key, matching the related edges "type" values.
       * @param  {EdgeProgramType} EdgeProgramClass - An edges program class.
       * @return {Sigma}
       */
    }, {
      key: "registerEdgeProgram",
      value: function registerEdgeProgram(key, EdgeProgramClass) {
        if (this.edgePrograms[key]) this.edgePrograms[key].kill();
        this.edgePrograms[key] = new EdgeProgramClass(this.webGLContexts.edges, this.frameBuffers.edges, this);
        return this;
      }

      /**
       * Internal function used to unregister a node program
       *
       * @param  {string} key - The program's key, matching the related nodes "type" values.
       * @return {Sigma}
       */
    }, {
      key: "unregisterNodeProgram",
      value: function unregisterNodeProgram(key) {
        if (this.nodePrograms[key]) {
          var _this$nodePrograms = this.nodePrograms,
            program = _this$nodePrograms[key],
            programs = _objectWithoutProperties(_this$nodePrograms, [key].map(_toPropertyKey));
          program.kill();
          this.nodePrograms = programs;
        }
        if (this.nodeHoverPrograms[key]) {
          var _this$nodeHoverProgra = this.nodeHoverPrograms,
            _program = _this$nodeHoverProgra[key],
            _programs = _objectWithoutProperties(_this$nodeHoverProgra, [key].map(_toPropertyKey));
          _program.kill();
          this.nodePrograms = _programs;
        }
        return this;
      }

      /**
       * Internal function used to unregister an edge program
       *
       * @param  {string} key - The program's key, matching the related edges "type" values.
       * @return {Sigma}
       */
    }, {
      key: "unregisterEdgeProgram",
      value: function unregisterEdgeProgram(key) {
        if (this.edgePrograms[key]) {
          var _this$edgePrograms = this.edgePrograms,
            program = _this$edgePrograms[key],
            programs = _objectWithoutProperties(_this$edgePrograms, [key].map(_toPropertyKey));
          program.kill();
          this.edgePrograms = programs;
        }
        return this;
      }

      /**
       * Method (re)binding WebGL texture (for picking).
       *
       * @return {Sigma}
       */
    }, {
      key: "resetWebGLTexture",
      value: function resetWebGLTexture(id) {
        var gl = this.webGLContexts[id];
        var frameBuffer = this.frameBuffers[id];
        var currentTexture = this.textures[id];
        if (currentTexture) gl.deleteTexture(currentTexture);
        var pickingTexture = gl.createTexture();
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.bindTexture(gl.TEXTURE_2D, pickingTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pickingTexture, 0);
        this.textures[id] = pickingTexture;
        return this;
      }

      /**
       * Method binding camera handlers.
       *
       * @return {Sigma}
       */
    }, {
      key: "bindCameraHandlers",
      value: function bindCameraHandlers() {
        var _this2 = this;
        this.activeListeners.camera = function () {
          _this2.scheduleRender();
        };
        this.camera.on("updated", this.activeListeners.camera);
        return this;
      }

      /**
       * Method unbinding camera handlers.
       *
       * @return {Sigma}
       */
    }, {
      key: "unbindCameraHandlers",
      value: function unbindCameraHandlers() {
        this.camera.removeListener("updated", this.activeListeners.camera);
        return this;
      }

      /**
       * Method that returns the closest node to a given position.
       */
    }, {
      key: "getNodeAtPosition",
      value: function getNodeAtPosition(position) {
        var x = position.x,
          y = position.y;
        var color = getPixelColor(this.webGLContexts.nodes, this.frameBuffers.nodes, x, y, this.pixelRatio, this.pickingDownSizingRatio);
        var index = colorToIndex.apply(void 0, _toConsumableArray(color));
        var itemAt = this.itemIDsIndex[index];
        return itemAt && itemAt.type === "node" ? itemAt.id : null;
      }

      /**
       * Method binding event handlers.
       *
       * @return {Sigma}
       */
    }, {
      key: "bindEventHandlers",
      value: function bindEventHandlers() {
        var _this3 = this;
        // Handling window resize
        this.activeListeners.handleResize = function () {
          // need to call a refresh to rebuild the labelgrid
          _this3.scheduleRefresh();
        };
        window.addEventListener("resize", this.activeListeners.handleResize);

        // Handling mouse move
        this.activeListeners.handleMove = function (e) {
          var event = cleanMouseCoords(e);
          var baseEvent = {
            event: event,
            preventSigmaDefault: function preventSigmaDefault() {
              event.preventSigmaDefault();
            }
          };
          var nodeToHover = _this3.getNodeAtPosition(event);
          if (nodeToHover && _this3.hoveredNode !== nodeToHover && !_this3.nodeDataCache[nodeToHover].hidden) {
            // Handling passing from one node to the other directly
            if (_this3.hoveredNode) _this3.emit("leaveNode", _objectSpread2(_objectSpread2({}, baseEvent), {}, {
              node: _this3.hoveredNode
            }));
            _this3.hoveredNode = nodeToHover;
            _this3.emit("enterNode", _objectSpread2(_objectSpread2({}, baseEvent), {}, {
              node: nodeToHover
            }));
            _this3.scheduleHighlightedNodesRender();
            return;
          }

          // Checking if the hovered node is still hovered
          if (_this3.hoveredNode) {
            if (_this3.getNodeAtPosition(event) !== _this3.hoveredNode) {
              var node = _this3.hoveredNode;
              _this3.hoveredNode = null;
              _this3.emit("leaveNode", _objectSpread2(_objectSpread2({}, baseEvent), {}, {
                node: node
              }));
              _this3.scheduleHighlightedNodesRender();
              return;
            }
          }
          if (_this3.settings.enableEdgeEvents) {
            var edgeToHover = _this3.hoveredNode ? null : _this3.getEdgeAtPoint(baseEvent.event.x, baseEvent.event.y);
            if (edgeToHover !== _this3.hoveredEdge) {
              if (_this3.hoveredEdge) _this3.emit("leaveEdge", _objectSpread2(_objectSpread2({}, baseEvent), {}, {
                edge: _this3.hoveredEdge
              }));
              if (edgeToHover) _this3.emit("enterEdge", _objectSpread2(_objectSpread2({}, baseEvent), {}, {
                edge: edgeToHover
              }));
              _this3.hoveredEdge = edgeToHover;
            }
          }
        };

        // Handling mouse move over body (only to dispatch the proper event):
        this.activeListeners.handleMoveBody = function (e) {
          var event = cleanMouseCoords(e);
          _this3.emit("moveBody", {
            event: event,
            preventSigmaDefault: function preventSigmaDefault() {
              event.preventSigmaDefault();
            }
          });
        };

        // Handling mouse leave stage:
        this.activeListeners.handleLeave = function (e) {
          var event = cleanMouseCoords(e);
          var baseEvent = {
            event: event,
            preventSigmaDefault: function preventSigmaDefault() {
              event.preventSigmaDefault();
            }
          };
          if (_this3.hoveredNode) {
            _this3.emit("leaveNode", _objectSpread2(_objectSpread2({}, baseEvent), {}, {
              node: _this3.hoveredNode
            }));
            _this3.scheduleHighlightedNodesRender();
          }
          if (_this3.settings.enableEdgeEvents && _this3.hoveredEdge) {
            _this3.emit("leaveEdge", _objectSpread2(_objectSpread2({}, baseEvent), {}, {
              edge: _this3.hoveredEdge
            }));
            _this3.scheduleHighlightedNodesRender();
          }
          _this3.emit("leaveStage", _objectSpread2({}, baseEvent));
        };

        // Handling mouse enter stage:
        this.activeListeners.handleEnter = function (e) {
          var event = cleanMouseCoords(e);
          var baseEvent = {
            event: event,
            preventSigmaDefault: function preventSigmaDefault() {
              event.preventSigmaDefault();
            }
          };
          _this3.emit("enterStage", _objectSpread2({}, baseEvent));
        };

        // Handling click
        var createInteractionListener = function createInteractionListener(eventType) {
          return function (e) {
            var event = cleanMouseCoords(e);
            var baseEvent = {
              event: event,
              preventSigmaDefault: function preventSigmaDefault() {
                event.preventSigmaDefault();
              }
            };
            var nodeAtPosition = _this3.getNodeAtPosition(event);
            if (nodeAtPosition) return _this3.emit("".concat(eventType, "Node"), _objectSpread2(_objectSpread2({}, baseEvent), {}, {
              node: nodeAtPosition
            }));
            if (_this3.settings.enableEdgeEvents) {
              var edge = _this3.getEdgeAtPoint(event.x, event.y);
              if (edge) return _this3.emit("".concat(eventType, "Edge"), _objectSpread2(_objectSpread2({}, baseEvent), {}, {
                edge: edge
              }));
            }
            return _this3.emit("".concat(eventType, "Stage"), baseEvent);
          };
        };
        this.activeListeners.handleClick = createInteractionListener("click");
        this.activeListeners.handleRightClick = createInteractionListener("rightClick");
        this.activeListeners.handleDoubleClick = createInteractionListener("doubleClick");
        this.activeListeners.handleWheel = createInteractionListener("wheel");
        this.activeListeners.handleDown = createInteractionListener("down");
        this.activeListeners.handleUp = createInteractionListener("up");
        this.mouseCaptor.on("mousemove", this.activeListeners.handleMove);
        this.mouseCaptor.on("mousemovebody", this.activeListeners.handleMoveBody);
        this.mouseCaptor.on("click", this.activeListeners.handleClick);
        this.mouseCaptor.on("rightClick", this.activeListeners.handleRightClick);
        this.mouseCaptor.on("doubleClick", this.activeListeners.handleDoubleClick);
        this.mouseCaptor.on("wheel", this.activeListeners.handleWheel);
        this.mouseCaptor.on("mousedown", this.activeListeners.handleDown);
        this.mouseCaptor.on("mouseup", this.activeListeners.handleUp);
        this.mouseCaptor.on("mouseleave", this.activeListeners.handleLeave);
        this.mouseCaptor.on("mouseenter", this.activeListeners.handleEnter);
        this.touchCaptor.on("touchdown", this.activeListeners.handleDown);
        this.touchCaptor.on("touchdown", this.activeListeners.handleMove);
        this.touchCaptor.on("touchup", this.activeListeners.handleUp);
        this.touchCaptor.on("touchmove", this.activeListeners.handleMove);
        this.touchCaptor.on("tap", this.activeListeners.handleClick);
        this.touchCaptor.on("doubletap", this.activeListeners.handleDoubleClick);
        this.touchCaptor.on("touchmove", this.activeListeners.handleMoveBody);
        return this;
      }

      /**
       * Method binding graph handlers
       *
       * @return {Sigma}
       */
    }, {
      key: "bindGraphHandlers",
      value: function bindGraphHandlers() {
        var _this4 = this;
        var graph = this.graph;
        var LAYOUT_IMPACTING_FIELDS = new Set(["x", "y", "zIndex", "type"]);
        this.activeListeners.eachNodeAttributesUpdatedGraphUpdate = function (e) {
          var _e$hints;
          var updatedFields = (_e$hints = e.hints) === null || _e$hints === void 0 ? void 0 : _e$hints.attributes;
          // we process all nodes
          _this4.graph.forEachNode(function (node) {
            return _this4.updateNode(node);
          });

          // if coord, type or zIndex have changed, we need to schedule a render
          // (zIndex for the programIndex)
          var layoutChanged = !updatedFields || updatedFields.some(function (f) {
            return LAYOUT_IMPACTING_FIELDS.has(f);
          });
          _this4.refresh({
            partialGraph: {
              nodes: graph.nodes()
            },
            skipIndexation: !layoutChanged,
            schedule: true
          });
        };
        this.activeListeners.eachEdgeAttributesUpdatedGraphUpdate = function (e) {
          var _e$hints2;
          var updatedFields = (_e$hints2 = e.hints) === null || _e$hints2 === void 0 ? void 0 : _e$hints2.attributes;
          // we process all edges
          _this4.graph.forEachEdge(function (edge) {
            return _this4.updateEdge(edge);
          });
          var layoutChanged = updatedFields && ["zIndex", "type"].some(function (f) {
            return updatedFields === null || updatedFields === void 0 ? void 0 : updatedFields.includes(f);
          });
          _this4.refresh({
            partialGraph: {
              edges: graph.edges()
            },
            skipIndexation: !layoutChanged,
            schedule: true
          });
        };

        // On add node, we add the node in indices and then call for a render
        this.activeListeners.addNodeGraphUpdate = function (payload) {
          var node = payload.key;
          // we process the node
          _this4.addNode(node);
          // schedule a render for the node
          _this4.refresh({
            partialGraph: {
              nodes: [node]
            },
            skipIndexation: false,
            schedule: true
          });
        };

        // On update node, we update indices and then call for a render
        this.activeListeners.updateNodeGraphUpdate = function (payload) {
          var node = payload.key;
          // schedule a render for the node
          _this4.refresh({
            partialGraph: {
              nodes: [node]
            },
            skipIndexation: false,
            schedule: true
          });
        };

        // On drop node, we remove the node from indices and then call for a refresh
        this.activeListeners.dropNodeGraphUpdate = function (payload) {
          var node = payload.key;
          // we process the node
          _this4.removeNode(node);
          // schedule a render for everything
          _this4.refresh({
            schedule: true
          });
        };

        // On add edge, we remove the edge from indices and then call for a refresh
        this.activeListeners.addEdgeGraphUpdate = function (payload) {
          var edge = payload.key;
          // we process the edge
          _this4.addEdge(edge);
          // schedule a render for the edge
          _this4.refresh({
            partialGraph: {
              edges: [edge]
            },
            schedule: true
          });
        };

        // On update edge, we update indices and then call for a refresh
        this.activeListeners.updateEdgeGraphUpdate = function (payload) {
          var edge = payload.key;
          // schedule a repaint for the edge
          _this4.refresh({
            partialGraph: {
              edges: [edge]
            },
            skipIndexation: false,
            schedule: true
          });
        };

        // On drop edge, we remove the edge from indices and then call for a refresh
        this.activeListeners.dropEdgeGraphUpdate = function (payload) {
          var edge = payload.key;
          // we process the edge
          _this4.removeEdge(edge);
          // schedule a render for all edges
          _this4.refresh({
            schedule: true
          });
        };

        // On clear edges, we clear the edge indices and then call for a refresh
        this.activeListeners.clearEdgesGraphUpdate = function () {
          // we clear the edge data structures
          _this4.clearEdgeState();
          _this4.clearEdgeIndices();
          // schedule a render for all edges
          _this4.refresh({
            schedule: true
          });
        };

        // On graph clear, we clear indices and then call for a refresh
        this.activeListeners.clearGraphUpdate = function () {
          // clear graph state
          _this4.clearEdgeState();
          _this4.clearNodeState();

          // clear graph indices
          _this4.clearEdgeIndices();
          _this4.clearNodeIndices();

          // schedule a render for all
          _this4.refresh({
            schedule: true
          });
        };
        graph.on("nodeAdded", this.activeListeners.addNodeGraphUpdate);
        graph.on("nodeDropped", this.activeListeners.dropNodeGraphUpdate);
        graph.on("nodeAttributesUpdated", this.activeListeners.updateNodeGraphUpdate);
        graph.on("eachNodeAttributesUpdated", this.activeListeners.eachNodeAttributesUpdatedGraphUpdate);
        graph.on("edgeAdded", this.activeListeners.addEdgeGraphUpdate);
        graph.on("edgeDropped", this.activeListeners.dropEdgeGraphUpdate);
        graph.on("edgeAttributesUpdated", this.activeListeners.updateEdgeGraphUpdate);
        graph.on("eachEdgeAttributesUpdated", this.activeListeners.eachEdgeAttributesUpdatedGraphUpdate);
        graph.on("edgesCleared", this.activeListeners.clearEdgesGraphUpdate);
        graph.on("cleared", this.activeListeners.clearGraphUpdate);
        return this;
      }

      /**
       * Method used to unbind handlers from the graph.
       *
       * @return {undefined}
       */
    }, {
      key: "unbindGraphHandlers",
      value: function unbindGraphHandlers() {
        var graph = this.graph;
        graph.removeListener("nodeAdded", this.activeListeners.addNodeGraphUpdate);
        graph.removeListener("nodeDropped", this.activeListeners.dropNodeGraphUpdate);
        graph.removeListener("nodeAttributesUpdated", this.activeListeners.updateNodeGraphUpdate);
        graph.removeListener("eachNodeAttributesUpdated", this.activeListeners.eachNodeAttributesUpdatedGraphUpdate);
        graph.removeListener("edgeAdded", this.activeListeners.addEdgeGraphUpdate);
        graph.removeListener("edgeDropped", this.activeListeners.dropEdgeGraphUpdate);
        graph.removeListener("edgeAttributesUpdated", this.activeListeners.updateEdgeGraphUpdate);
        graph.removeListener("eachEdgeAttributesUpdated", this.activeListeners.eachEdgeAttributesUpdatedGraphUpdate);
        graph.removeListener("edgesCleared", this.activeListeners.clearEdgesGraphUpdate);
        graph.removeListener("cleared", this.activeListeners.clearGraphUpdate);
      }

      /**
       * Method looking for an edge colliding with a given point at (x, y). Returns
       * the key of the edge if any, or null else.
       */
    }, {
      key: "getEdgeAtPoint",
      value: function getEdgeAtPoint(x, y) {
        var color = getPixelColor(this.webGLContexts.edges, this.frameBuffers.edges, x, y, this.pixelRatio, this.pickingDownSizingRatio);
        var index = colorToIndex.apply(void 0, _toConsumableArray(color));
        var itemAt = this.itemIDsIndex[index];
        return itemAt && itemAt.type === "edge" ? itemAt.id : null;
      }

      /**
       * Method used to process the whole graph's data.
       *  - extent
       *  - normalizationFunction
       *  - compute node's coordinate
       *  - labelgrid
       *  - program data allocation
       * @return {Sigma}
       */
    }, {
      key: "process",
      value: function process() {
        var _this5 = this;
        this.emit("beforeProcess");
        var graph = this.graph;
        var settings = this.settings;
        var dimensions = this.getDimensions();

        //
        // NODES
        //
        this.nodeExtent = graphExtent(this.graph);
        if (!this.settings.autoRescale) {
          var width = dimensions.width,
            height = dimensions.height;
          var _this$nodeExtent = this.nodeExtent,
            x = _this$nodeExtent.x,
            y = _this$nodeExtent.y;
          this.nodeExtent = {
            x: [(x[0] + x[1]) / 2 - width / 2, (x[0] + x[1]) / 2 + width / 2],
            y: [(y[0] + y[1]) / 2 - height / 2, (y[0] + y[1]) / 2 + height / 2]
          };
        }
        this.normalizationFunction = createNormalizationFunction(this.customBBox || this.nodeExtent);

        // NOTE: it is important to compute this matrix after computing the node's extent
        // because #.getGraphDimensions relies on it
        var nullCamera = new Camera();
        var nullCameraMatrix = matrixFromCamera(nullCamera.getState(), dimensions, this.getGraphDimensions(), this.getStagePadding());
        // Resetting the label grid
        // TODO: it's probably better to do this explicitly or on resizes for layout and anims
        this.labelGrid.resizeAndClear(dimensions, settings.labelGridCellSize);
        var nodesPerPrograms = {};
        var nodeIndices = {};
        var edgeIndices = {};
        var itemIDsIndex = {};
        var incrID = 1;
        var nodes = graph.nodes();

        // Do some indexation on the whole graph
        for (var i = 0, l = nodes.length; i < l; i++) {
          var node = nodes[i];
          var data = this.nodeDataCache[node];

          // Get initial coordinates
          var attrs = graph.getNodeAttributes(node);
          data.x = attrs.x;
          data.y = attrs.y;
          this.normalizationFunction.applyTo(data);

          // labelgrid
          if (typeof data.label === "string" && !data.hidden) this.labelGrid.add(node, data.size, this.framedGraphToViewport(data, {
            matrix: nullCameraMatrix
          }));

          // update count per program
          nodesPerPrograms[data.type] = (nodesPerPrograms[data.type] || 0) + 1;
        }
        this.labelGrid.organize();

        // Allocate memory to programs
        for (var type in this.nodePrograms) {
          if (!hasOwnProperty.call(this.nodePrograms, type)) {
            throw new Error("Sigma: could not find a suitable program for node type \"".concat(type, "\"!"));
          }
          this.nodePrograms[type].reallocate(nodesPerPrograms[type] || 0);
          // We reset that count here, so that we can reuse it while calling the Program#process methods:
          nodesPerPrograms[type] = 0;
        }

        // Order nodes by zIndex before to add them to program
        if (this.settings.zIndex && this.nodeZExtent[0] !== this.nodeZExtent[1]) nodes = zIndexOrdering(this.nodeZExtent, function (node) {
          return _this5.nodeDataCache[node].zIndex;
        }, nodes);

        // Add data to programs
        for (var _i = 0, _l = nodes.length; _i < _l; _i++) {
          var _node = nodes[_i];
          nodeIndices[_node] = incrID;
          itemIDsIndex[nodeIndices[_node]] = {
            type: "node",
            id: _node
          };
          incrID++;
          var _data = this.nodeDataCache[_node];
          this.addNodeToProgram(_node, nodeIndices[_node], nodesPerPrograms[_data.type]++);
        }

        //
        // EDGES
        //

        var edgesPerPrograms = {};
        var edges = graph.edges();

        // Allocate memory to programs
        for (var _i2 = 0, _l2 = edges.length; _i2 < _l2; _i2++) {
          var edge = edges[_i2];
          var _data2 = this.edgeDataCache[edge];
          edgesPerPrograms[_data2.type] = (edgesPerPrograms[_data2.type] || 0) + 1;
        }

        // Order edges by zIndex before to add them to program
        if (this.settings.zIndex && this.edgeZExtent[0] !== this.edgeZExtent[1]) edges = zIndexOrdering(this.edgeZExtent, function (edge) {
          return _this5.edgeDataCache[edge].zIndex;
        }, edges);
        for (var _type2 in this.edgePrograms) {
          if (!hasOwnProperty.call(this.edgePrograms, _type2)) {
            throw new Error("Sigma: could not find a suitable program for edge type \"".concat(_type2, "\"!"));
          }
          this.edgePrograms[_type2].reallocate(edgesPerPrograms[_type2] || 0);
          // We reset that count here, so that we can reuse it while calling the Program#process methods:
          edgesPerPrograms[_type2] = 0;
        }

        // Add data to programs
        for (var _i3 = 0, _l3 = edges.length; _i3 < _l3; _i3++) {
          var _edge = edges[_i3];
          edgeIndices[_edge] = incrID;
          itemIDsIndex[edgeIndices[_edge]] = {
            type: "edge",
            id: _edge
          };
          incrID++;
          var _data3 = this.edgeDataCache[_edge];
          this.addEdgeToProgram(_edge, edgeIndices[_edge], edgesPerPrograms[_data3.type]++);
        }
        this.itemIDsIndex = itemIDsIndex;
        this.nodeIndices = nodeIndices;
        this.edgeIndices = edgeIndices;
        this.emit("afterProcess");
        return this;
      }

      /**
       * Method that backports potential settings updates where it's needed.
       * @private
       */
    }, {
      key: "handleSettingsUpdate",
      value: function handleSettingsUpdate(oldSettings) {
        var _this6 = this;
        var settings = this.settings;
        this.camera.minRatio = settings.minCameraRatio;
        this.camera.maxRatio = settings.maxCameraRatio;
        this.camera.enabledZooming = settings.enableCameraZooming;
        this.camera.enabledPanning = settings.enableCameraPanning;
        this.camera.enabledRotation = settings.enableCameraRotation;
        if (settings.cameraPanBoundaries) {
          this.camera.clean = function (state) {
            return _this6.cleanCameraState(state, settings.cameraPanBoundaries && _typeof(settings.cameraPanBoundaries) === "object" ? settings.cameraPanBoundaries : {});
          };
        } else {
          this.camera.clean = null;
        }
        this.camera.setState(this.camera.validateState(this.camera.getState()));
        if (oldSettings) {
          // Check edge programs:
          if (oldSettings.edgeProgramClasses !== settings.edgeProgramClasses) {
            for (var type in settings.edgeProgramClasses) {
              if (settings.edgeProgramClasses[type] !== oldSettings.edgeProgramClasses[type]) {
                this.registerEdgeProgram(type, settings.edgeProgramClasses[type]);
              }
            }
            for (var _type3 in oldSettings.edgeProgramClasses) {
              if (!settings.edgeProgramClasses[_type3]) this.unregisterEdgeProgram(_type3);
            }
          }

          // Check node programs:
          if (oldSettings.nodeProgramClasses !== settings.nodeProgramClasses || oldSettings.nodeHoverProgramClasses !== settings.nodeHoverProgramClasses) {
            for (var _type4 in settings.nodeProgramClasses) {
              if (settings.nodeProgramClasses[_type4] !== oldSettings.nodeProgramClasses[_type4] || settings.nodeHoverProgramClasses[_type4] !== oldSettings.nodeHoverProgramClasses[_type4]) {
                this.registerNodeProgram(_type4, settings.nodeProgramClasses[_type4], settings.nodeHoverProgramClasses[_type4]);
              }
            }
            for (var _type5 in oldSettings.nodeProgramClasses) {
              if (!settings.nodeProgramClasses[_type5]) this.unregisterNodeProgram(_type5);
            }
          }
        }

        // Update captors settings:
        this.mouseCaptor.setSettings(this.settings);
        this.touchCaptor.setSettings(this.settings);
        return this;
      }
    }, {
      key: "cleanCameraState",
      value: function cleanCameraState(state) {
        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref$tolerance = _ref.tolerance,
          tolerance = _ref$tolerance === void 0 ? 0 : _ref$tolerance,
          boundaries = _ref.boundaries;
        var newState = _objectSpread2({}, state);

        // Extract necessary properties
        var _ref2 = boundaries || this.nodeExtent,
          _ref2$x = _slicedToArray(_ref2.x, 2),
          xMinGraph = _ref2$x[0],
          xMaxGraph = _ref2$x[1],
          _ref2$y = _slicedToArray(_ref2.y, 2),
          yMinGraph = _ref2$y[0],
          yMaxGraph = _ref2$y[1];

        // Transform the four corners of the graph rectangle using the provided camera state
        var corners = [this.graphToViewport({
          x: xMinGraph,
          y: yMinGraph
        }, {
          cameraState: state
        }), this.graphToViewport({
          x: xMaxGraph,
          y: yMinGraph
        }, {
          cameraState: state
        }), this.graphToViewport({
          x: xMinGraph,
          y: yMaxGraph
        }, {
          cameraState: state
        }), this.graphToViewport({
          x: xMaxGraph,
          y: yMaxGraph
        }, {
          cameraState: state
        })];

        // Look for new extents, based on these four corners
        var xMin = Infinity,
          xMax = -Infinity,
          yMin = Infinity,
          yMax = -Infinity;
        corners.forEach(function (_ref3) {
          var x = _ref3.x,
            y = _ref3.y;
          xMin = Math.min(xMin, x);
          xMax = Math.max(xMax, x);
          yMin = Math.min(yMin, y);
          yMax = Math.max(yMax, y);
        });

        // For each dimension, constraint the smaller element (camera or graph) to fit in the larger one:
        var graphWidth = xMax - xMin;
        var graphHeight = yMax - yMin;
        var _this$getDimensions = this.getDimensions(),
          width = _this$getDimensions.width,
          height = _this$getDimensions.height;
        var dx = 0;
        var dy = 0;
        if (graphWidth >= width) {
          if (xMax < width - tolerance) dx = xMax - (width - tolerance);else if (xMin > tolerance) dx = xMin - tolerance;
        } else {
          if (xMax > width + tolerance) dx = xMax - (width + tolerance);else if (xMin < -tolerance) dx = xMin + tolerance;
        }
        if (graphHeight >= height) {
          if (yMax < height - tolerance) dy = yMax - (height - tolerance);else if (yMin > tolerance) dy = yMin - tolerance;
        } else {
          if (yMax > height + tolerance) dy = yMax - (height + tolerance);else if (yMin < -tolerance) dy = yMin + tolerance;
        }
        if (dx || dy) {
          // Transform [dx, dy] from viewport to graph (using two different point to transform that vector):
          var origin = this.viewportToFramedGraph({
            x: 0,
            y: 0
          }, {
            cameraState: state
          });
          var delta = this.viewportToFramedGraph({
            x: dx,
            y: dy
          }, {
            cameraState: state
          });
          dx = delta.x - origin.x;
          dy = delta.y - origin.y;
          newState.x += dx;
          newState.y += dy;
        }
        return newState;
      }

      /**
       * Method used to render labels.
       *
       * @return {Sigma}
       */
    }, {
      key: "renderLabels",
      value: function renderLabels() {
        if (!this.settings.renderLabels) return this;
        var cameraState = this.camera.getState();

        // Selecting labels to draw
        var labelsToDisplay = this.labelGrid.getLabelsToDisplay(cameraState.ratio, this.settings.labelDensity);
        extend(labelsToDisplay, this.nodesWithForcedLabels);
        this.displayedNodeLabels = new Set();

        // Drawing labels
        var context = this.canvasContexts.labels;
        for (var i = 0, l = labelsToDisplay.length; i < l; i++) {
          var node = labelsToDisplay[i];
          var data = this.nodeDataCache[node];

          // If the node was already drawn (like if it is eligible AND has
          // `forceLabel`), we don't want to draw it again
          // NOTE: we can do better probably
          if (this.displayedNodeLabels.has(node)) continue;

          // If the node is hidden, we don't need to display its label obviously
          if (data.hidden) continue;
          var _this$framedGraphToVi = this.framedGraphToViewport(data),
            x = _this$framedGraphToVi.x,
            y = _this$framedGraphToVi.y;

          // NOTE: we can cache the labels we need to render until the camera's ratio changes
          var size = this.scaleSize(data.size);

          // Is node big enough?
          if (!data.forceLabel && size < this.settings.labelRenderedSizeThreshold) continue;

          // Is node actually on screen (with some margin)
          // NOTE: we used to rely on the quadtree for this, but the coordinates
          // conversion make it unreliable and at that point we already converted
          // to viewport coordinates and since the label grid already culls the
          // number of potential labels to display this looks like a good
          // performance compromise.
          // NOTE: labelGrid.getLabelsToDisplay could probably optimize by not
          // considering cells obviously outside of the range of the current
          // view rectangle.
          if (x < -X_LABEL_MARGIN || x > this.width + X_LABEL_MARGIN || y < -Y_LABEL_MARGIN || y > this.height + Y_LABEL_MARGIN) continue;

          // Because displayed edge labels depend directly on actually rendered node
          // labels, we need to only add to this.displayedNodeLabels nodes whose label
          // is rendered.
          // This makes this.displayedNodeLabels depend on viewport, which might become
          // an issue once we start memoizing getLabelsToDisplay.
          this.displayedNodeLabels.add(node);
          var defaultDrawNodeLabel = this.settings.defaultDrawNodeLabel;
          var nodeProgram = this.nodePrograms[data.type];
          var drawLabel = (nodeProgram === null || nodeProgram === void 0 ? void 0 : nodeProgram.drawLabel) || defaultDrawNodeLabel;
          drawLabel(context, _objectSpread2(_objectSpread2({
            key: node
          }, data), {}, {
            size: size,
            x: x,
            y: y
          }), this.settings);
        }
        return this;
      }

      /**
       * Method used to render edge labels, based on which node labels were
       * rendered.
       *
       * @return {Sigma}
       */
    }, {
      key: "renderEdgeLabels",
      value: function renderEdgeLabels() {
        if (!this.settings.renderEdgeLabels) return this;
        var context = this.canvasContexts.edgeLabels;

        // Clearing
        context.clearRect(0, 0, this.width, this.height);
        var edgeLabelsToDisplay = edgeLabelsToDisplayFromNodes({
          graph: this.graph,
          hoveredNode: this.hoveredNode,
          displayedNodeLabels: this.displayedNodeLabels,
          highlightedNodes: this.highlightedNodes
        });
        extend(edgeLabelsToDisplay, this.edgesWithForcedLabels);
        var displayedLabels = new Set();
        for (var i = 0, l = edgeLabelsToDisplay.length; i < l; i++) {
          var edge = edgeLabelsToDisplay[i],
            extremities = this.graph.extremities(edge),
            sourceData = this.nodeDataCache[extremities[0]],
            targetData = this.nodeDataCache[extremities[1]],
            edgeData = this.edgeDataCache[edge];

          // If the edge was already drawn (like if it is eligible AND has
          // `forceLabel`), we don't want to draw it again
          if (displayedLabels.has(edge)) continue;

          // If the edge is hidden we don't need to display its label
          // NOTE: the test on sourceData & targetData is probably paranoid at this point?
          if (edgeData.hidden || sourceData.hidden || targetData.hidden) {
            continue;
          }
          var defaultDrawEdgeLabel = this.settings.defaultDrawEdgeLabel;
          var edgeProgram = this.edgePrograms[edgeData.type];
          var drawLabel = (edgeProgram === null || edgeProgram === void 0 ? void 0 : edgeProgram.drawLabel) || defaultDrawEdgeLabel;
          drawLabel(context, _objectSpread2(_objectSpread2({
            key: edge
          }, edgeData), {}, {
            size: this.scaleSize(edgeData.size)
          }), _objectSpread2(_objectSpread2(_objectSpread2({
            key: extremities[0]
          }, sourceData), this.framedGraphToViewport(sourceData)), {}, {
            size: this.scaleSize(sourceData.size)
          }), _objectSpread2(_objectSpread2(_objectSpread2({
            key: extremities[1]
          }, targetData), this.framedGraphToViewport(targetData)), {}, {
            size: this.scaleSize(targetData.size)
          }), this.settings);
          displayedLabels.add(edge);
        }
        this.displayedEdgeLabels = displayedLabels;
        return this;
      }

      /**
       * Method used to render the highlighted nodes.
       *
       * @return {Sigma}
       */
    }, {
      key: "renderHighlightedNodes",
      value: function renderHighlightedNodes() {
        var _this7 = this;
        var context = this.canvasContexts.hovers;

        // Clearing
        context.clearRect(0, 0, this.width, this.height);

        // Rendering
        var render = function render(node) {
          var data = _this7.nodeDataCache[node];
          var _this7$framedGraphToV = _this7.framedGraphToViewport(data),
            x = _this7$framedGraphToV.x,
            y = _this7$framedGraphToV.y;
          var size = _this7.scaleSize(data.size);
          var defaultDrawNodeHover = _this7.settings.defaultDrawNodeHover;
          var nodeProgram = _this7.nodePrograms[data.type];
          var drawHover = (nodeProgram === null || nodeProgram === void 0 ? void 0 : nodeProgram.drawHover) || defaultDrawNodeHover;
          drawHover(context, _objectSpread2(_objectSpread2({
            key: node
          }, data), {}, {
            size: size,
            x: x,
            y: y
          }), _this7.settings);
        };
        var nodesToRender = [];
        if (this.hoveredNode && !this.nodeDataCache[this.hoveredNode].hidden) {
          nodesToRender.push(this.hoveredNode);
        }
        this.highlightedNodes.forEach(function (node) {
          // The hovered node has already been highlighted
          if (node !== _this7.hoveredNode) nodesToRender.push(node);
        });

        // Draw labels:
        nodesToRender.forEach(function (node) {
          return render(node);
        });

        // Draw WebGL nodes on top of the labels:
        var nodesPerPrograms = {};

        // 1. Count nodes per type:
        nodesToRender.forEach(function (node) {
          var type = _this7.nodeDataCache[node].type;
          nodesPerPrograms[type] = (nodesPerPrograms[type] || 0) + 1;
        });
        // 2. Allocate for each type for the proper number of nodes
        for (var type in this.nodeHoverPrograms) {
          this.nodeHoverPrograms[type].reallocate(nodesPerPrograms[type] || 0);
          // Also reset count, to use when rendering:
          nodesPerPrograms[type] = 0;
        }
        // 3. Process all nodes to render:
        nodesToRender.forEach(function (node) {
          var data = _this7.nodeDataCache[node];
          _this7.nodeHoverPrograms[data.type].process(0, nodesPerPrograms[data.type]++, data);
        });
        // 4. Clear hovered nodes layer:
        this.webGLContexts.hoverNodes.clear(this.webGLContexts.hoverNodes.COLOR_BUFFER_BIT);
        // 5. Render:
        var renderParams = this.getRenderParams();
        for (var _type6 in this.nodeHoverPrograms) {
          var program = this.nodeHoverPrograms[_type6];
          program.render(renderParams);
        }
      }

      /**
       * Method used to schedule a hover render.
       *
       */
    }, {
      key: "scheduleHighlightedNodesRender",
      value: function scheduleHighlightedNodesRender() {
        var _this8 = this;
        if (this.renderHighlightedNodesFrame || this.renderFrame) return;
        this.renderHighlightedNodesFrame = requestAnimationFrame(function () {
          // Resetting state
          _this8.renderHighlightedNodesFrame = null;

          // Rendering
          _this8.renderHighlightedNodes();
          _this8.renderEdgeLabels();
        });
      }

      /**
       * Method used to render.
       *
       * @return {Sigma}
       */
    }, {
      key: "render",
      value: function render() {
        var _this9 = this;
        this.emit("beforeRender");
        var exitRender = function exitRender() {
          _this9.emit("afterRender");
          return _this9;
        };

        // If a render was scheduled, we cancel it
        if (this.renderFrame) {
          cancelAnimationFrame(this.renderFrame);
          this.renderFrame = null;
        }

        // First we need to resize
        this.resize();

        // Do we need to reprocess data?
        if (this.needToProcess) this.process();
        this.needToProcess = false;

        // Clearing the canvases
        this.clear();

        // Prepare the textures
        this.pickingLayers.forEach(function (layer) {
          return _this9.resetWebGLTexture(layer);
        });

        // If we have no nodes we can stop right there
        if (!this.graph.order) return exitRender();

        // TODO: improve this heuristic or move to the captor itself?
        // TODO: deal with the touch captor here as well
        var mouseCaptor = this.mouseCaptor;
        var moving = this.camera.isAnimated() || mouseCaptor.isMoving || mouseCaptor.draggedEvents || mouseCaptor.currentWheelDirection;

        // Then we need to extract a matrix from the camera
        var cameraState = this.camera.getState();
        var viewportDimensions = this.getDimensions();
        var graphDimensions = this.getGraphDimensions();
        var padding = this.getStagePadding();
        this.matrix = matrixFromCamera(cameraState, viewportDimensions, graphDimensions, padding);
        this.invMatrix = matrixFromCamera(cameraState, viewportDimensions, graphDimensions, padding, true);
        this.correctionRatio = getMatrixImpact(this.matrix, cameraState, viewportDimensions);
        this.graphToViewportRatio = this.getGraphToViewportRatio();

        // [jacomyal]
        // This comment is related to the one above the `getMatrixImpact` definition:
        // - `this.correctionRatio` is somehow not completely explained
        // - `this.graphToViewportRatio` is the ratio of a distance in the viewport divided by the same distance in the
        //   graph
        // - `this.normalizationFunction.ratio` is basically `Math.max(graphDX, graphDY)`
        // And now, I observe that if I multiply these three ratios, I have something constant, which value remains 2, even
        // when I change the graph, the viewport or the camera. It might be useful later, so I prefer to let this comment:
        // console.log(this.graphToViewportRatio * this.correctionRatio * this.normalizationFunction.ratio * 2);

        var params = this.getRenderParams();

        // Drawing nodes
        for (var type in this.nodePrograms) {
          var program = this.nodePrograms[type];
          program.render(params);
        }

        // Drawing edges
        if (!this.settings.hideEdgesOnMove || !moving) {
          for (var _type7 in this.edgePrograms) {
            var _program2 = this.edgePrograms[_type7];
            _program2.render(params);
          }
        }

        // Do not display labels on move per setting
        if (this.settings.hideLabelsOnMove && moving) return exitRender();
        this.renderLabels();
        this.renderEdgeLabels();
        this.renderHighlightedNodes();
        return exitRender();
      }

      /**
       * Add a node in the internal data structures.
       * @private
       * @param key The node's graphology ID
       */
    }, {
      key: "addNode",
      value: function addNode(key) {
        // Node display data resolution:
        //  1. First we get the node's attributes
        //  2. We optionally reduce them using the function provided by the user
        //     Note that this function must return a total object and won't be merged
        //  3. We apply our defaults, while running some vital checks
        //  4. We apply the normalization function
        // We shallow copy node data to avoid dangerous behaviors from reducers
        var attr = Object.assign({}, this.graph.getNodeAttributes(key));
        if (this.settings.nodeReducer) attr = this.settings.nodeReducer(key, attr);
        var data = applyNodeDefaults(this.settings, key, attr);
        this.nodeDataCache[key] = data;

        // Label:
        // We delete and add if needed because this function is also used from
        // update
        this.nodesWithForcedLabels["delete"](key);
        if (data.forceLabel && !data.hidden) this.nodesWithForcedLabels.add(key);

        // Highlighted:
        // We remove and re add if needed because this function is also used from
        // update
        this.highlightedNodes["delete"](key);
        if (data.highlighted && !data.hidden) this.highlightedNodes.add(key);

        // zIndex
        if (this.settings.zIndex) {
          if (data.zIndex < this.nodeZExtent[0]) this.nodeZExtent[0] = data.zIndex;
          if (data.zIndex > this.nodeZExtent[1]) this.nodeZExtent[1] = data.zIndex;
        }
      }

      /**
       * Update a node the internal data structures.
       * @private
       * @param key The node's graphology ID
       */
    }, {
      key: "updateNode",
      value: function updateNode(key) {
        this.addNode(key);

        // Re-apply normalization on the node
        var data = this.nodeDataCache[key];
        this.normalizationFunction.applyTo(data);
      }

      /**
       * Remove a node from the internal data structures.
       * @private
       * @param key The node's graphology ID
       */
    }, {
      key: "removeNode",
      value: function removeNode(key) {
        // Remove from node cache
        delete this.nodeDataCache[key];
        // Remove from node program index
        delete this.nodeProgramIndex[key];
        // Remove from higlighted nodes
        this.highlightedNodes["delete"](key);
        // Remove from hovered
        if (this.hoveredNode === key) this.hoveredNode = null;
        // Remove from forced label
        this.nodesWithForcedLabels["delete"](key);
      }

      /**
       * Add an edge into the internal data structures.
       * @private
       * @param key The edge's graphology ID
       */
    }, {
      key: "addEdge",
      value: function addEdge(key) {
        // Edge display data resolution:
        //  1. First we get the edge's attributes
        //  2. We optionally reduce them using the function provided by the user
        //  3. Note that this function must return a total object and won't be merged
        //  4. We apply our defaults, while running some vital checks
        // We shallow copy edge data to avoid dangerous behaviors from reducers
        var attr = Object.assign({}, this.graph.getEdgeAttributes(key));
        if (this.settings.edgeReducer) attr = this.settings.edgeReducer(key, attr);
        var data = applyEdgeDefaults(this.settings, key, attr);
        this.edgeDataCache[key] = data;

        // Forced label
        // we filter and re push if needed because this function is also used from
        // update
        this.edgesWithForcedLabels["delete"](key);
        if (data.forceLabel && !data.hidden) this.edgesWithForcedLabels.add(key);

        // Check zIndex
        if (this.settings.zIndex) {
          if (data.zIndex < this.edgeZExtent[0]) this.edgeZExtent[0] = data.zIndex;
          if (data.zIndex > this.edgeZExtent[1]) this.edgeZExtent[1] = data.zIndex;
        }
      }

      /**
       * Update an edge in the internal data structures.
       * @private
       * @param key The edge's graphology ID
       */
    }, {
      key: "updateEdge",
      value: function updateEdge(key) {
        this.addEdge(key);
      }

      /**
       * Remove an edge from the internal data structures.
       * @private
       * @param key The edge's graphology ID
       */
    }, {
      key: "removeEdge",
      value: function removeEdge(key) {
        // Remove from edge cache
        delete this.edgeDataCache[key];
        // Remove from programId index
        delete this.edgeProgramIndex[key];
        // Remove from hovered
        if (this.hoveredEdge === key) this.hoveredEdge = null;
        // Remove from forced label
        this.edgesWithForcedLabels["delete"](key);
      }

      /**
       * Clear all indices related to nodes.
       * @private
       */
    }, {
      key: "clearNodeIndices",
      value: function clearNodeIndices() {
        // LabelGrid & nodeExtent are only manage/populated in the process function
        this.labelGrid = new LabelGrid();
        this.nodeExtent = {
          x: [0, 1],
          y: [0, 1]
        };
        this.nodeDataCache = {};
        this.edgeProgramIndex = {};
        this.nodesWithForcedLabels = new Set();
        this.nodeZExtent = [Infinity, -Infinity];
        this.highlightedNodes = new Set();
      }

      /**
       * Clear all indices related to edges.
       * @private
       */
    }, {
      key: "clearEdgeIndices",
      value: function clearEdgeIndices() {
        this.edgeDataCache = {};
        this.edgeProgramIndex = {};
        this.edgesWithForcedLabels = new Set();
        this.edgeZExtent = [Infinity, -Infinity];
      }

      /**
       * Clear all indices.
       * @private
       */
    }, {
      key: "clearIndices",
      value: function clearIndices() {
        this.clearEdgeIndices();
        this.clearNodeIndices();
      }

      /**
       * Clear all graph state related to nodes.
       * @private
       */
    }, {
      key: "clearNodeState",
      value: function clearNodeState() {
        this.displayedNodeLabels = new Set();
        this.highlightedNodes = new Set();
        this.hoveredNode = null;
      }

      /**
       * Clear all graph state related to edges.
       * @private
       */
    }, {
      key: "clearEdgeState",
      value: function clearEdgeState() {
        this.displayedEdgeLabels = new Set();
        this.highlightedNodes = new Set();
        this.hoveredEdge = null;
      }

      /**
       * Clear all graph state.
       * @private
       */
    }, {
      key: "clearState",
      value: function clearState() {
        this.clearEdgeState();
        this.clearNodeState();
      }

      /**
       * Add the node data to its program.
       * @private
       * @param node The node's graphology ID
       * @param fingerprint A fingerprint used to identity the node with picking
       * @param position The index where to place the node in the program
       */
    }, {
      key: "addNodeToProgram",
      value: function addNodeToProgram(node, fingerprint, position) {
        var data = this.nodeDataCache[node];
        var nodeProgram = this.nodePrograms[data.type];
        if (!nodeProgram) throw new Error("Sigma: could not find a suitable program for node type \"".concat(data.type, "\"!"));
        nodeProgram.process(fingerprint, position, data);
        // Saving program index
        this.nodeProgramIndex[node] = position;
      }

      /**
       * Add the edge data to its program.
       * @private
       * @param edge The edge's graphology ID
       * @param fingerprint A fingerprint used to identity the edge with picking
       * @param position The index where to place the edge in the program
       */
    }, {
      key: "addEdgeToProgram",
      value: function addEdgeToProgram(edge, fingerprint, position) {
        var data = this.edgeDataCache[edge];
        var edgeProgram = this.edgePrograms[data.type];
        if (!edgeProgram) throw new Error("Sigma: could not find a suitable program for edge type \"".concat(data.type, "\"!"));
        var extremities = this.graph.extremities(edge),
          sourceData = this.nodeDataCache[extremities[0]],
          targetData = this.nodeDataCache[extremities[1]];
        edgeProgram.process(fingerprint, position, sourceData, targetData, data);
        // Saving program index
        this.edgeProgramIndex[edge] = position;
      }

      /**---------------------------------------------------------------------------
       * Public API.
       **---------------------------------------------------------------------------
       */

      /**
       * Function used to get the render params.
       *
       * @return {RenderParams}
       */
    }, {
      key: "getRenderParams",
      value: function getRenderParams() {
        return {
          matrix: this.matrix,
          invMatrix: this.invMatrix,
          width: this.width,
          height: this.height,
          pixelRatio: this.pixelRatio,
          zoomRatio: this.camera.ratio,
          cameraAngle: this.camera.angle,
          sizeRatio: 1 / this.scaleSize(),
          correctionRatio: this.correctionRatio,
          downSizingRatio: this.pickingDownSizingRatio,
          minEdgeThickness: this.settings.minEdgeThickness,
          antiAliasingFeather: this.settings.antiAliasingFeather
        };
      }

      /**
       * Function used to retrieve the actual stage padding value.
       *
       * @return {number}
       */
    }, {
      key: "getStagePadding",
      value: function getStagePadding() {
        var _this$settings = this.settings,
          stagePadding = _this$settings.stagePadding,
          autoRescale = _this$settings.autoRescale;
        return autoRescale ? stagePadding || 0 : 0;
      }

      /**
       * Function used to create a layer element.
       *
       * @param {string} id - Context's id.
       * @param {string} tag - The HTML tag to use.
       * @param options
       * @return {Sigma}
       */
    }, {
      key: "createLayer",
      value: function createLayer(id, tag) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        if (this.elements[id]) throw new Error("Sigma: a layer named \"".concat(id, "\" already exists"));
        var element = createElement(tag, {
          position: "absolute"
        }, {
          "class": "sigma-".concat(id)
        });
        if (options.style) Object.assign(element.style, options.style);
        this.elements[id] = element;
        if ("beforeLayer" in options && options.beforeLayer) {
          this.elements[options.beforeLayer].before(element);
        } else if ("afterLayer" in options && options.afterLayer) {
          this.elements[options.afterLayer].after(element);
        } else {
          this.container.appendChild(element);
        }
        return element;
      }

      /**
       * Function used to create a canvas element.
       *
       * @param {string} id - Context's id.
       * @param options
       * @return {Sigma}
       */
    }, {
      key: "createCanvas",
      value: function createCanvas(id) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        return this.createLayer(id, "canvas", options);
      }

      /**
       * Function used to create a canvas context and add the relevant DOM elements.
       *
       * @param  {string} id - Context's id.
       * @param  options
       * @return {Sigma}
       */
    }, {
      key: "createCanvasContext",
      value: function createCanvasContext(id) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var canvas = this.createCanvas(id, options);
        var contextOptions = {
          preserveDrawingBuffer: false,
          antialias: false
        };
        this.canvasContexts[id] = canvas.getContext("2d", contextOptions);
        return this;
      }

      /**
       * Function used to create a WebGL context and add the relevant DOM
       * elements.
       *
       * @param  {string}  id      - Context's id.
       * @param  {object?} options - #getContext params to override (optional)
       * @return {WebGLRenderingContext}
       */
    }, {
      key: "createWebGLContext",
      value: function createWebGLContext(id) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var canvas = (options === null || options === void 0 ? void 0 : options.canvas) || this.createCanvas(id, options);
        if (options.hidden) canvas.remove();
        var contextOptions = _objectSpread2({
          preserveDrawingBuffer: false,
          antialias: false
        }, options);
        var context;

        // First we try webgl2 for an easy performance boost
        context = canvas.getContext("webgl2", contextOptions);

        // Else we fall back to webgl
        if (!context) context = canvas.getContext("webgl", contextOptions);

        // Edge, I am looking right at you...
        if (!context) context = canvas.getContext("experimental-webgl", contextOptions);
        var gl = context;
        this.webGLContexts[id] = gl;

        // Blending:
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // Prepare frame buffer for picking layers:
        if (options.picking) {
          this.pickingLayers.add(id);
          var newFrameBuffer = gl.createFramebuffer();
          if (!newFrameBuffer) throw new Error("Sigma: cannot create a new frame buffer for layer ".concat(id));
          this.frameBuffers[id] = newFrameBuffer;
        }
        return gl;
      }

      /**
       * Function used to properly kill a layer.
       *
       * @param  {string} id - Layer id.
       * @return {Sigma}
       */
    }, {
      key: "killLayer",
      value: function killLayer(id) {
        var element = this.elements[id];
        if (!element) throw new Error("Sigma: cannot kill layer ".concat(id, ", which does not exist"));
        if (this.webGLContexts[id]) {
          var _gl$getExtension;
          var gl = this.webGLContexts[id];
          (_gl$getExtension = gl.getExtension("WEBGL_lose_context")) === null || _gl$getExtension === void 0 || _gl$getExtension.loseContext();
          delete this.webGLContexts[id];
        } else if (this.canvasContexts[id]) {
          delete this.canvasContexts[id];
        }

        // Delete layer element
        element.remove();
        delete this.elements[id];
        return this;
      }

      /**
       * Method returning the renderer's camera.
       *
       * @return {Camera}
       */
    }, {
      key: "getCamera",
      value: function getCamera() {
        return this.camera;
      }

      /**
       * Method setting the renderer's camera.
       *
       * @param  {Camera} camera - New camera.
       * @return {Sigma}
       */
    }, {
      key: "setCamera",
      value: function setCamera(camera) {
        this.unbindCameraHandlers();
        this.camera = camera;
        this.bindCameraHandlers();
      }

      /**
       * Method returning the container DOM element.
       *
       * @return {HTMLElement}
       */
    }, {
      key: "getContainer",
      value: function getContainer() {
        return this.container;
      }

      /**
       * Method returning the renderer's graph.
       *
       * @return {Graph}
       */
    }, {
      key: "getGraph",
      value: function getGraph() {
        return this.graph;
      }

      /**
       * Method used to set the renderer's graph.
       *
       * @return {Graph}
       */
    }, {
      key: "setGraph",
      value: function setGraph(graph) {
        if (graph === this.graph) return;

        // Check hoveredNode and hoveredEdge
        if (this.hoveredNode && !graph.hasNode(this.hoveredNode)) this.hoveredNode = null;
        if (this.hoveredEdge && !graph.hasEdge(this.hoveredEdge)) this.hoveredEdge = null;

        // Unbinding handlers on the current graph
        this.unbindGraphHandlers();
        if (this.checkEdgesEventsFrame !== null) {
          cancelAnimationFrame(this.checkEdgesEventsFrame);
          this.checkEdgesEventsFrame = null;
        }

        // Installing new graph
        this.graph = graph;

        // Binding new handlers
        this.bindGraphHandlers();

        // Re-rendering now to avoid discrepancies from now to next frame
        this.refresh();
      }

      /**
       * Method returning the mouse captor.
       *
       * @return {MouseCaptor}
       */
    }, {
      key: "getMouseCaptor",
      value: function getMouseCaptor() {
        return this.mouseCaptor;
      }

      /**
       * Method returning the touch captor.
       *
       * @return {TouchCaptor}
       */
    }, {
      key: "getTouchCaptor",
      value: function getTouchCaptor() {
        return this.touchCaptor;
      }

      /**
       * Method returning the current renderer's dimensions.
       *
       * @return {Dimensions}
       */
    }, {
      key: "getDimensions",
      value: function getDimensions() {
        return {
          width: this.width,
          height: this.height
        };
      }

      /**
       * Method returning the current graph's dimensions.
       *
       * @return {Dimensions}
       */
    }, {
      key: "getGraphDimensions",
      value: function getGraphDimensions() {
        var extent = this.customBBox || this.nodeExtent;
        return {
          width: extent.x[1] - extent.x[0] || 1,
          height: extent.y[1] - extent.y[0] || 1
        };
      }

      /**
       * Method used to get all the sigma node attributes.
       * It's useful for example to get the position of a node
       * and to get values that are set by the nodeReducer
       *
       * @param  {string} key - The node's key.
       * @return {NodeDisplayData | undefined} A copy of the desired node's attribute or undefined if not found
       */
    }, {
      key: "getNodeDisplayData",
      value: function getNodeDisplayData(key) {
        var node = this.nodeDataCache[key];
        return node ? Object.assign({}, node) : undefined;
      }

      /**
       * Method used to get all the sigma edge attributes.
       * It's useful for example to get values that are set by the edgeReducer.
       *
       * @param  {string} key - The edge's key.
       * @return {EdgeDisplayData | undefined} A copy of the desired edge's attribute or undefined if not found
       */
    }, {
      key: "getEdgeDisplayData",
      value: function getEdgeDisplayData(key) {
        var edge = this.edgeDataCache[key];
        return edge ? Object.assign({}, edge) : undefined;
      }

      /**
       * Method used to get the set of currently displayed node labels.
       *
       * @return {Set<string>} A set of node keys whose label is displayed.
       */
    }, {
      key: "getNodeDisplayedLabels",
      value: function getNodeDisplayedLabels() {
        return new Set(this.displayedNodeLabels);
      }

      /**
       * Method used to get the set of currently displayed edge labels.
       *
       * @return {Set<string>} A set of edge keys whose label is displayed.
       */
    }, {
      key: "getEdgeDisplayedLabels",
      value: function getEdgeDisplayedLabels() {
        return new Set(this.displayedEdgeLabels);
      }

      /**
       * Method returning a copy of the settings collection.
       *
       * @return {Settings} A copy of the settings collection.
       */
    }, {
      key: "getSettings",
      value: function getSettings() {
        return _objectSpread2({}, this.settings);
      }

      /**
       * Method returning the current value for a given setting key.
       *
       * @param  {string} key - The setting key to get.
       * @return {any} The value attached to this setting key or undefined if not found
       */
    }, {
      key: "getSetting",
      value: function getSetting(key) {
        return this.settings[key];
      }

      /**
       * Method setting the value of a given setting key. Note that this will schedule
       * a new render next frame.
       *
       * @param  {string} key - The setting key to set.
       * @param  {any}    value - The value to set.
       * @return {Sigma}
       */
    }, {
      key: "setSetting",
      value: function setSetting(key, value) {
        var oldValues = _objectSpread2({}, this.settings);
        this.settings[key] = value;
        validateSettings(this.settings);
        this.handleSettingsUpdate(oldValues);
        this.scheduleRefresh();
        return this;
      }

      /**
       * Method updating the value of a given setting key using the provided function.
       * Note that this will schedule a new render next frame.
       *
       * @param  {string}   key     - The setting key to set.
       * @param  {function} updater - The update function.
       * @return {Sigma}
       */
    }, {
      key: "updateSetting",
      value: function updateSetting(key, updater) {
        this.setSetting(key, updater(this.settings[key]));
        return this;
      }

      /**
       * Method setting multiple settings at once.
       *
       * @param  {Partial<Settings>} settings - The settings to set.
       * @return {Sigma}
       */
    }, {
      key: "setSettings",
      value: function setSettings(settings) {
        var oldValues = _objectSpread2({}, this.settings);
        this.settings = _objectSpread2(_objectSpread2({}, this.settings), settings);
        validateSettings(this.settings);
        this.handleSettingsUpdate(oldValues);
        this.scheduleRefresh();
        return this;
      }

      /**
       * Method used to resize the renderer.
       *
       * @param  {boolean} force - If true, then resize is processed even if size is unchanged (optional).
       * @return {Sigma}
       */
    }, {
      key: "resize",
      value: function resize(force) {
        var previousWidth = this.width,
          previousHeight = this.height;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.pixelRatio = getPixelRatio();
        if (this.width === 0) {
          if (this.settings.allowInvalidContainer) this.width = 1;else throw new Error("Sigma: Container has no width. You can set the allowInvalidContainer setting to true to stop seeing this error.");
        }
        if (this.height === 0) {
          if (this.settings.allowInvalidContainer) this.height = 1;else throw new Error("Sigma: Container has no height. You can set the allowInvalidContainer setting to true to stop seeing this error.");
        }

        // If nothing has changed, we can stop right here
        if (!force && previousWidth === this.width && previousHeight === this.height) return this;

        // Sizing dom elements
        for (var id in this.elements) {
          var element = this.elements[id];
          element.style.width = this.width + "px";
          element.style.height = this.height + "px";
        }

        // Sizing canvas contexts
        for (var _id in this.canvasContexts) {
          this.elements[_id].setAttribute("width", this.width * this.pixelRatio + "px");
          this.elements[_id].setAttribute("height", this.height * this.pixelRatio + "px");
          if (this.pixelRatio !== 1) this.canvasContexts[_id].scale(this.pixelRatio, this.pixelRatio);
        }

        // Sizing WebGL contexts
        for (var _id2 in this.webGLContexts) {
          this.elements[_id2].setAttribute("width", this.width * this.pixelRatio + "px");
          this.elements[_id2].setAttribute("height", this.height * this.pixelRatio + "px");
          var gl = this.webGLContexts[_id2];
          gl.viewport(0, 0, this.width * this.pixelRatio, this.height * this.pixelRatio);

          // Clear picking texture if needed
          if (this.pickingLayers.has(_id2)) {
            var currentTexture = this.textures[_id2];
            if (currentTexture) gl.deleteTexture(currentTexture);
          }
        }
        this.emit("resize");
        return this;
      }

      /**
       * Method used to clear all the canvases.
       *
       * @return {Sigma}
       */
    }, {
      key: "clear",
      value: function clear() {
        this.emit("beforeClear");
        this.webGLContexts.nodes.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null);
        this.webGLContexts.nodes.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);
        this.webGLContexts.edges.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null);
        this.webGLContexts.edges.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);
        this.webGLContexts.hoverNodes.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);
        this.canvasContexts.labels.clearRect(0, 0, this.width, this.height);
        this.canvasContexts.hovers.clearRect(0, 0, this.width, this.height);
        this.canvasContexts.edgeLabels.clearRect(0, 0, this.width, this.height);
        this.emit("afterClear");
        return this;
      }

      /**
       * Method used to refresh, i.e. force the renderer to reprocess graph
       * data and render, but keep the state.
       * - if a partialGraph is provided, we only reprocess those nodes & edges.
       * - if schedule is TRUE, we schedule a render instead of sync render
       * - if skipIndexation is TRUE, then labelGrid & program indexation are skipped (can be used if you haven't modify x, y, zIndex & size)
       *
       * @return {Sigma}
       */
    }, {
      key: "refresh",
      value: function refresh(opts) {
        var _this10 = this;
        var skipIndexation = (opts === null || opts === void 0 ? void 0 : opts.skipIndexation) !== undefined ? opts === null || opts === void 0 ? void 0 : opts.skipIndexation : false;
        var schedule = (opts === null || opts === void 0 ? void 0 : opts.schedule) !== undefined ? opts.schedule : false;
        var fullRefresh = !opts || !opts.partialGraph;
        if (fullRefresh) {
          // Re-index graph data
          this.clearEdgeIndices();
          this.clearNodeIndices();
          this.graph.forEachNode(function (node) {
            return _this10.addNode(node);
          });
          this.graph.forEachEdge(function (edge) {
            return _this10.addEdge(edge);
          });
        } else {
          var _opts$partialGraph, _opts$partialGraph2;
          var nodes = ((_opts$partialGraph = opts.partialGraph) === null || _opts$partialGraph === void 0 ? void 0 : _opts$partialGraph.nodes) || [];
          for (var i = 0, l = (nodes === null || nodes === void 0 ? void 0 : nodes.length) || 0; i < l; i++) {
            var node = nodes[i];
            // Recompute node's data (ie. apply reducer)
            this.updateNode(node);
            // Add node to the program if layout is unchanged.
            // otherwise it will be done in the process function
            if (skipIndexation) {
              var programIndex = this.nodeProgramIndex[node];
              if (programIndex === undefined) throw new Error("Sigma: node \"".concat(node, "\" can't be repaint"));
              this.addNodeToProgram(node, this.nodeIndices[node], programIndex);
            }
          }
          var edges = (opts === null || opts === void 0 || (_opts$partialGraph2 = opts.partialGraph) === null || _opts$partialGraph2 === void 0 ? void 0 : _opts$partialGraph2.edges) || [];
          for (var _i4 = 0, _l4 = edges.length; _i4 < _l4; _i4++) {
            var edge = edges[_i4];
            // Recompute edge's data (ie. apply reducer)
            this.updateEdge(edge);
            // Add edge to the program
            // otherwise it will be done in the process function
            if (skipIndexation) {
              var _programIndex = this.edgeProgramIndex[edge];
              if (_programIndex === undefined) throw new Error("Sigma: edge \"".concat(edge, "\" can't be repaint"));
              this.addEdgeToProgram(edge, this.edgeIndices[edge], _programIndex);
            }
          }
        }

        // Do we need to call the process function ?
        if (fullRefresh || !skipIndexation) this.needToProcess = true;
        if (schedule) this.scheduleRender();else this.render();
        return this;
      }

      /**
       * Method used to schedule a render at the next available frame.
       * This method can be safely called on a same frame because it basically
       * debounces refresh to the next frame.
       *
       * @return {Sigma}
       */
    }, {
      key: "scheduleRender",
      value: function scheduleRender() {
        var _this11 = this;
        if (!this.renderFrame) {
          this.renderFrame = requestAnimationFrame(function () {
            _this11.render();
          });
        }
        return this;
      }

      /**
       * Method used to schedule a refresh (i.e. fully reprocess graph data and render)
       * at the next available frame.
       * This method can be safely called on a same frame because it basically
       * debounces refresh to the next frame.
       *
       * @return {Sigma}
       */
    }, {
      key: "scheduleRefresh",
      value: function scheduleRefresh(opts) {
        return this.refresh(_objectSpread2(_objectSpread2({}, opts), {}, {
          schedule: true
        }));
      }

      /**
       * Method used to (un)zoom, while preserving the position of a viewport point.
       * Used for instance to zoom "on the mouse cursor".
       *
       * @param viewportTarget
       * @param newRatio
       * @return {CameraState}
       */
    }, {
      key: "getViewportZoomedState",
      value: function getViewportZoomedState(viewportTarget, newRatio) {
        var _this$camera$getState = this.camera.getState(),
          ratio = _this$camera$getState.ratio,
          angle = _this$camera$getState.angle,
          x = _this$camera$getState.x,
          y = _this$camera$getState.y;
        var _this$settings2 = this.settings,
          minCameraRatio = _this$settings2.minCameraRatio,
          maxCameraRatio = _this$settings2.maxCameraRatio;
        if (typeof maxCameraRatio === "number") newRatio = Math.min(newRatio, maxCameraRatio);
        if (typeof minCameraRatio === "number") newRatio = Math.max(newRatio, minCameraRatio);
        var ratioDiff = newRatio / ratio;
        var center = {
          x: this.width / 2,
          y: this.height / 2
        };
        var graphMousePosition = this.viewportToFramedGraph(viewportTarget);
        var graphCenterPosition = this.viewportToFramedGraph(center);
        return {
          angle: angle,
          x: (graphMousePosition.x - graphCenterPosition.x) * (1 - ratioDiff) + x,
          y: (graphMousePosition.y - graphCenterPosition.y) * (1 - ratioDiff) + y,
          ratio: newRatio
        };
      }

      /**
       * Method returning the abstract rectangle containing the graph according
       * to the camera's state.
       *
       * @return {object} - The view's rectangle.
       */
    }, {
      key: "viewRectangle",
      value: function viewRectangle() {
        var p1 = this.viewportToFramedGraph({
            x: 0,
            y: 0
          }),
          p2 = this.viewportToFramedGraph({
            x: this.width,
            y: 0
          }),
          h = this.viewportToFramedGraph({
            x: 0,
            y: this.height
          });
        return {
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          height: p2.y - h.y
        };
      }

      /**
       * Method returning the coordinates of a point from the framed graph system to the viewport system. It allows
       * overriding anything that is used to get the translation matrix, or even the matrix itself.
       *
       * Be careful if overriding dimensions, padding or cameraState, as the computation of the matrix is not the lightest
       * of computations.
       */
    }, {
      key: "framedGraphToViewport",
      value: function framedGraphToViewport(coordinates) {
        var override = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var recomputeMatrix = !!override.cameraState || !!override.viewportDimensions || !!override.graphDimensions;
        var matrix = override.matrix ? override.matrix : recomputeMatrix ? matrixFromCamera(override.cameraState || this.camera.getState(), override.viewportDimensions || this.getDimensions(), override.graphDimensions || this.getGraphDimensions(), override.padding || this.getStagePadding()) : this.matrix;
        var viewportPos = multiplyVec2(matrix, coordinates);
        return {
          x: (1 + viewportPos.x) * this.width / 2,
          y: (1 - viewportPos.y) * this.height / 2
        };
      }

      /**
       * Method returning the coordinates of a point from the viewport system to the framed graph system. It allows
       * overriding anything that is used to get the translation matrix, or even the matrix itself.
       *
       * Be careful if overriding dimensions, padding or cameraState, as the computation of the matrix is not the lightest
       * of computations.
       */
    }, {
      key: "viewportToFramedGraph",
      value: function viewportToFramedGraph(coordinates) {
        var override = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var recomputeMatrix = !!override.cameraState || !!override.viewportDimensions || !override.graphDimensions;
        var invMatrix = override.matrix ? override.matrix : recomputeMatrix ? matrixFromCamera(override.cameraState || this.camera.getState(), override.viewportDimensions || this.getDimensions(), override.graphDimensions || this.getGraphDimensions(), override.padding || this.getStagePadding(), true) : this.invMatrix;
        var res = multiplyVec2(invMatrix, {
          x: coordinates.x / this.width * 2 - 1,
          y: 1 - coordinates.y / this.height * 2
        });
        if (isNaN(res.x)) res.x = 0;
        if (isNaN(res.y)) res.y = 0;
        return res;
      }

      /**
       * Method used to translate a point's coordinates from the viewport system (pixel distance from the top-left of the
       * stage) to the graph system (the reference system of data as they are in the given graph instance).
       *
       * This method accepts an optional camera which can be useful if you need to translate coordinates
       * based on a different view than the one being currently being displayed on screen.
       *
       * @param {Coordinates}                  viewportPoint
       * @param {CoordinateConversionOverride} override
       */
    }, {
      key: "viewportToGraph",
      value: function viewportToGraph(viewportPoint) {
        var override = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        return this.normalizationFunction.inverse(this.viewportToFramedGraph(viewportPoint, override));
      }

      /**
       * Method used to translate a point's coordinates from the graph system (the reference system of data as they are in
       * the given graph instance) to the viewport system (pixel distance from the top-left of the stage).
       *
       * This method accepts an optional camera which can be useful if you need to translate coordinates
       * based on a different view than the one being currently being displayed on screen.
       *
       * @param {Coordinates}                  graphPoint
       * @param {CoordinateConversionOverride} override
       */
    }, {
      key: "graphToViewport",
      value: function graphToViewport(graphPoint) {
        var override = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        return this.framedGraphToViewport(this.normalizationFunction(graphPoint), override);
      }

      /**
       * Method returning the distance multiplier between the graph system and the
       * viewport system.
       */
    }, {
      key: "getGraphToViewportRatio",
      value: function getGraphToViewportRatio() {
        var graphP1 = {
          x: 0,
          y: 0
        };
        var graphP2 = {
          x: 1,
          y: 1
        };
        var graphD = Math.sqrt(Math.pow(graphP1.x - graphP2.x, 2) + Math.pow(graphP1.y - graphP2.y, 2));
        var viewportP1 = this.graphToViewport(graphP1);
        var viewportP2 = this.graphToViewport(graphP2);
        var viewportD = Math.sqrt(Math.pow(viewportP1.x - viewportP2.x, 2) + Math.pow(viewportP1.y - viewportP2.y, 2));
        return viewportD / graphD;
      }

      /**
       * Method returning the graph's bounding box.
       *
       * @return {{ x: Extent, y: Extent }}
       */
    }, {
      key: "getBBox",
      value: function getBBox() {
        return this.nodeExtent;
      }

      /**
       * Method returning the graph's custom bounding box, if any.
       *
       * @return {{ x: Extent, y: Extent } | null}
       */
    }, {
      key: "getCustomBBox",
      value: function getCustomBBox() {
        return this.customBBox;
      }

      /**
       * Method used to override the graph's bounding box with a custom one. Give `null` as the argument to stop overriding.
       *
       * @return {Sigma}
       */
    }, {
      key: "setCustomBBox",
      value: function setCustomBBox(customBBox) {
        this.customBBox = customBBox;
        this.scheduleRender();
        return this;
      }

      /**
       * Method used to shut the container & release event listeners.
       *
       * @return {undefined}
       */
    }, {
      key: "kill",
      value: function kill() {
        // Emitting "kill" events so that plugins and such can cleanup
        this.emit("kill");

        // Releasing events
        this.removeAllListeners();

        // Releasing camera handlers
        this.unbindCameraHandlers();

        // Releasing DOM events & captors
        window.removeEventListener("resize", this.activeListeners.handleResize);
        this.mouseCaptor.kill();
        this.touchCaptor.kill();

        // Releasing graph handlers
        this.unbindGraphHandlers();

        // Releasing cache & state
        this.clearIndices();
        this.clearState();
        this.nodeDataCache = {};
        this.edgeDataCache = {};
        this.highlightedNodes.clear();

        // Clearing frames
        if (this.renderFrame) {
          cancelAnimationFrame(this.renderFrame);
          this.renderFrame = null;
        }
        if (this.renderHighlightedNodesFrame) {
          cancelAnimationFrame(this.renderHighlightedNodesFrame);
          this.renderHighlightedNodesFrame = null;
        }

        // Destroying canvases
        var container = this.container;
        while (container.firstChild) container.removeChild(container.firstChild);

        // Kill programs:
        for (var type in this.nodePrograms) {
          this.nodePrograms[type].kill();
        }
        for (var _type8 in this.nodeHoverPrograms) {
          this.nodeHoverPrograms[_type8].kill();
        }
        for (var _type9 in this.edgePrograms) {
          this.edgePrograms[_type9].kill();
        }
        this.nodePrograms = {};
        this.nodeHoverPrograms = {};
        this.edgePrograms = {};

        // Kill all canvas/WebGL contexts
        for (var id in this.elements) {
          this.killLayer(id);
        }

        // Destroying remaining collections
        this.canvasContexts = {};
        this.webGLContexts = {};
        this.elements = {};
      }

      /**
       * Method used to scale the given size according to the camera's ratio, i.e.
       * zooming state.
       *
       * @param  {number?} size -        The size to scale (node size, edge thickness etc.).
       * @param  {number?} cameraRatio - A camera ratio (defaults to the actual camera ratio).
       * @return {number}              - The scaled size.
       */
    }, {
      key: "scaleSize",
      value: function scaleSize() {
        var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
        var cameraRatio = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.camera.ratio;
        return size / this.settings.zoomToSizeRatioFunction(cameraRatio) * (this.getSetting("itemSizesReference") === "positions" ? cameraRatio * this.graphToViewportRatio : 1);
      }

      /**
       * Method that returns the collection of all used canvases.
       * At the moment, the instantiated canvases are the following, and in the
       * following order in the DOM:
       * - `edges`
       * - `nodes`
       * - `edgeLabels`
       * - `labels`
       * - `hovers`
       * - `hoverNodes`
       * - `mouse`
       *
       * @return {PlainObject<HTMLCanvasElement>} - The collection of canvases.
       */
    }, {
      key: "getCanvases",
      value: function getCanvases() {
        var res = {};
        for (var layer in this.elements) if (this.elements[layer] instanceof HTMLCanvasElement) res[layer] = this.elements[layer];
        return res;
      }
    }]);
  }(TypedEventEmitter);

  /**
   * Sigma.js Library Endpoint
   * =========================
   *
   * The library endpoint.
   * @module
   */
  var Sigma = Sigma$1;

  window.Sigma = Sigma;

}));
