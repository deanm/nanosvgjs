// (c) 2016 Dean McNamee <dean@gmail.com>
//
// https://github.com/deanm/nanosvgjs
//
// Partially automatic and then painfully by hand translation of the NanoSVG
// C code to a somewhat awkward JavaScript implementation following roughly the
// same logic, code layout, datastructures, etc.  Of course things like strings,
// arrays, memory manage, etc must be handled differently.
//
// The majority of the code was translated with a custom C parser to JavaScript
// emitter, but then many C-isms had to be manually addressed after the fact.
//
// The code JavaScript was then run through clang-format since the C-AST to
// JavaScript conversion produced over-parenthesized and generally pretty badly
// formatted code.

/*
 * Copyright (c) 2013-14 Mikko Mononen memon@inside.org
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 * claim that you wrote the original software. If you use this software
 * in a product, an acknowledgment in the product documentation would be
 * appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 * misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 *
 * The SVG parser is based on Anti-Graim Geometry 2.4 SVG example
 * Copyright (C) 2002-2004 Maxim Shemanarev (McSeem) (http://www.antigrain.com/)
 *
 * Arc calculation code based on canvg (https://code.google.com/p/canvg/)
 *
 * Bounding box calculation based on http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
 *
 */

"use strict";

// (c) Dean McNamee <dean@gmail.com>, 2012.
//
// https://github.com/deanm/css-color-parser-js
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

// http://www.w3.org/TR/css3-color/
var kCSSColorTable = {
  "transparent": [0,0,0,0], "aliceblue": [240,248,255,1],
  "antiquewhite": [250,235,215,1], "aqua": [0,255,255,1],
  "aquamarine": [127,255,212,1], "azure": [240,255,255,1],
  "beige": [245,245,220,1], "bisque": [255,228,196,1],
  "black": [0,0,0,1], "blanchedalmond": [255,235,205,1],
  "blue": [0,0,255,1], "blueviolet": [138,43,226,1],
  "brown": [165,42,42,1], "burlywood": [222,184,135,1],
  "cadetblue": [95,158,160,1], "chartreuse": [127,255,0,1],
  "chocolate": [210,105,30,1], "coral": [255,127,80,1],
  "cornflowerblue": [100,149,237,1], "cornsilk": [255,248,220,1],
  "crimson": [220,20,60,1], "cyan": [0,255,255,1],
  "darkblue": [0,0,139,1], "darkcyan": [0,139,139,1],
  "darkgoldenrod": [184,134,11,1], "darkgray": [169,169,169,1],
  "darkgreen": [0,100,0,1], "darkgrey": [169,169,169,1],
  "darkkhaki": [189,183,107,1], "darkmagenta": [139,0,139,1],
  "darkolivegreen": [85,107,47,1], "darkorange": [255,140,0,1],
  "darkorchid": [153,50,204,1], "darkred": [139,0,0,1],
  "darksalmon": [233,150,122,1], "darkseagreen": [143,188,143,1],
  "darkslateblue": [72,61,139,1], "darkslategray": [47,79,79,1],
  "darkslategrey": [47,79,79,1], "darkturquoise": [0,206,209,1],
  "darkviolet": [148,0,211,1], "deeppink": [255,20,147,1],
  "deepskyblue": [0,191,255,1], "dimgray": [105,105,105,1],
  "dimgrey": [105,105,105,1], "dodgerblue": [30,144,255,1],
  "firebrick": [178,34,34,1], "floralwhite": [255,250,240,1],
  "forestgreen": [34,139,34,1], "fuchsia": [255,0,255,1],
  "gainsboro": [220,220,220,1], "ghostwhite": [248,248,255,1],
  "gold": [255,215,0,1], "goldenrod": [218,165,32,1],
  "gray": [128,128,128,1], "green": [0,128,0,1],
  "greenyellow": [173,255,47,1], "grey": [128,128,128,1],
  "honeydew": [240,255,240,1], "hotpink": [255,105,180,1],
  "indianred": [205,92,92,1], "indigo": [75,0,130,1],
  "ivory": [255,255,240,1], "khaki": [240,230,140,1],
  "lavender": [230,230,250,1], "lavenderblush": [255,240,245,1],
  "lawngreen": [124,252,0,1], "lemonchiffon": [255,250,205,1],
  "lightblue": [173,216,230,1], "lightcoral": [240,128,128,1],
  "lightcyan": [224,255,255,1], "lightgoldenrodyellow": [250,250,210,1],
  "lightgray": [211,211,211,1], "lightgreen": [144,238,144,1],
  "lightgrey": [211,211,211,1], "lightpink": [255,182,193,1],
  "lightsalmon": [255,160,122,1], "lightseagreen": [32,178,170,1],
  "lightskyblue": [135,206,250,1], "lightslategray": [119,136,153,1],
  "lightslategrey": [119,136,153,1], "lightsteelblue": [176,196,222,1],
  "lightyellow": [255,255,224,1], "lime": [0,255,0,1],
  "limegreen": [50,205,50,1], "linen": [250,240,230,1],
  "magenta": [255,0,255,1], "maroon": [128,0,0,1],
  "mediumaquamarine": [102,205,170,1], "mediumblue": [0,0,205,1],
  "mediumorchid": [186,85,211,1], "mediumpurple": [147,112,219,1],
  "mediumseagreen": [60,179,113,1], "mediumslateblue": [123,104,238,1],
  "mediumspringgreen": [0,250,154,1], "mediumturquoise": [72,209,204,1],
  "mediumvioletred": [199,21,133,1], "midnightblue": [25,25,112,1],
  "mintcream": [245,255,250,1], "mistyrose": [255,228,225,1],
  "moccasin": [255,228,181,1], "navajowhite": [255,222,173,1],
  "navy": [0,0,128,1], "oldlace": [253,245,230,1],
  "olive": [128,128,0,1], "olivedrab": [107,142,35,1],
  "orange": [255,165,0,1], "orangered": [255,69,0,1],
  "orchid": [218,112,214,1], "palegoldenrod": [238,232,170,1],
  "palegreen": [152,251,152,1], "paleturquoise": [175,238,238,1],
  "palevioletred": [219,112,147,1], "papayawhip": [255,239,213,1],
  "peachpuff": [255,218,185,1], "peru": [205,133,63,1],
  "pink": [255,192,203,1], "plum": [221,160,221,1],
  "powderblue": [176,224,230,1], "purple": [128,0,128,1],
  "red": [255,0,0,1], "rosybrown": [188,143,143,1],
  "royalblue": [65,105,225,1], "saddlebrown": [139,69,19,1],
  "salmon": [250,128,114,1], "sandybrown": [244,164,96,1],
  "seagreen": [46,139,87,1], "seashell": [255,245,238,1],
  "sienna": [160,82,45,1], "silver": [192,192,192,1],
  "skyblue": [135,206,235,1], "slateblue": [106,90,205,1],
  "slategray": [112,128,144,1], "slategrey": [112,128,144,1],
  "snow": [255,250,250,1], "springgreen": [0,255,127,1],
  "steelblue": [70,130,180,1], "tan": [210,180,140,1],
  "teal": [0,128,128,1], "thistle": [216,191,216,1],
  "tomato": [255,99,71,1], "turquoise": [64,224,208,1],
  "violet": [238,130,238,1], "wheat": [245,222,179,1],
  "white": [255,255,255,1], "whitesmoke": [245,245,245,1],
  "yellow": [255,255,0,1], "yellowgreen": [154,205,50,1]}

function clamp_css_byte(i) {  // Clamp to integer 0 .. 255.
  i = Math.round(i);  // Seems to be what Chrome does (vs truncation).
  return i < 0 ? 0 : i > 255 ? 255 : i;
}

function clamp_css_float(f) {  // Clamp to float 0.0 .. 1.0.
  return f < 0 ? 0 : f > 1 ? 1 : f;
}

function parse_css_int(str) {  // int or percentage.
  if (str[str.length - 1] === '%')
    return clamp_css_byte(parseFloat(str) / 100 * 255);
  return clamp_css_byte(parseInt(str));
}

function parse_css_float(str) {  // float or percentage.
  if (str[str.length - 1] === '%')
    return clamp_css_float(parseFloat(str) / 100);
  return clamp_css_float(parseFloat(str));
}

function css_hue_to_rgb(m1, m2, h) {
  if (h < 0) h += 1;
  else if (h > 1) h -= 1;

  if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
  if (h * 2 < 1) return m2;
  if (h * 3 < 2) return m1 + (m2 - m1) * (2/3 - h) * 6;
  return m1;
}

function parseCSSColor(css_str) {
  // Remove all whitespace, not compliant, but should just be more accepting.
  var str = css_str.replace(/ /g, '').toLowerCase();

  // Color keywords (and transparent) lookup.
  if (str in kCSSColorTable) return kCSSColorTable[str].slice();  // dup.

  // #abc and #abc123 syntax.
  if (str[0] === '#') {
    if (str.length === 4) {
      var iv = parseInt(str.substr(1), 16);  // TODO(deanm): Stricter parsing.
      if (!(iv >= 0 && iv <= 0xfff)) return null;  // Covers NaN.
      return [((iv & 0xf00) >> 4) | ((iv & 0xf00) >> 8),
              (iv & 0xf0) | ((iv & 0xf0) >> 4),
              (iv & 0xf) | ((iv & 0xf) << 4),
              1];
    } else if (str.length === 7) {
      var iv = parseInt(str.substr(1), 16);  // TODO(deanm): Stricter parsing.
      if (!(iv >= 0 && iv <= 0xffffff)) return null;  // Covers NaN.
      return [(iv & 0xff0000) >> 16,
              (iv & 0xff00) >> 8,
              iv & 0xff,
              1];
    }

    return null;
  }

  var op = str.indexOf('('), ep = str.indexOf(')');
  if (op !== -1 && ep + 1 === str.length) {
    var fname = str.substr(0, op);
    var params = str.substr(op+1, ep-(op+1)).split(',');
    var alpha = 1;  // To allow case fallthrough.
    switch (fname) {
      case 'rgba':
        if (params.length !== 4) return null;
        alpha = parse_css_float(params.pop());
        // Fall through.
      case 'rgb':
        if (params.length !== 3) return null;
        return [parse_css_int(params[0]),
                parse_css_int(params[1]),
                parse_css_int(params[2]),
                alpha];
      case 'hsla':
        if (params.length !== 4) return null;
        alpha = parse_css_float(params.pop());
        // Fall through.
      case 'hsl':
        if (params.length !== 3) return null;
        var h = (((parseFloat(params[0]) % 360) + 360) % 360) / 360;  // 0 .. 1
        // NOTE(deanm): According to the CSS spec s/l should only be
        // percentages, but we don't bother and let float or percentage.
        var s = parse_css_float(params[1]);
        var l = parse_css_float(params[2]);
        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        var m1 = l * 2 - m2;
        return [clamp_css_byte(css_hue_to_rgb(m1, m2, h+1/3) * 255),
                clamp_css_byte(css_hue_to_rgb(m1, m2, h) * 255),
                clamp_css_byte(css_hue_to_rgb(m1, m2, h-1/3) * 255),
                alpha];
      default:
        return null;
    }
  }

  return null;
}

function makearr(num, cons) {
  var a = [ ];
  while (num--) a.push(new cons());
  return a;
}

function makezeroarr(num) {
  var a = [ ];
  while (num--) a.push(0);
  return a;
}

function zeroarr(a) {
  for (var i = 0, il = a.length; i < il; ++i) a[i] = 0;
  return a;
}

function arrcpy(a, b) {
  if (a.length !== b.length) throw 'arrcpy of mismatched lengths';
  for (var i = 0, il = b.length; i < il; ++i) a[i] = b[i];
}

function strchr(hay, need) {
  return hay.indexOf(need) === -1 ? 0 : 1;
}

function last_index_of_chars(hay, need) {
  return Math.max.apply(null, need.split('').map(x => hay.lastIndexOf(x)));
}

function realloc(obj, size, cons) {
  if (obj.length === size) return obj;
  var n = new cons(size);
  n.set(obj);
  return n;
}

function sqrtf(f) { return Math.sqrt(f); }
function sqrt(f)  { return Math.sqrt(f); }
function atof(a)  { return parseFloat(a) || 0; }
function fabs(a)  { return a < 0 ? -a : a; }
function fabsf(a) { return a < 0 ? -a : a; }
function sinf(x)  { return Math.sin(x); }
function cosf(x)  { return Math.cos(x); }
function acosf(x) { return Math.acos(x); }

// Unsigned version of `a |= x << 24`
// Shift left 24 and or.  In JavaScript bitwise is always treated as signed, so
// we need to do a multiply and add to produce an unsigned number...
function orsl24(a, x) {
  return a + (x | 0) * (1 << 24);
}

function NSVGgradientStop() {
  /* unsigned int */ this.color = 0;
  /* float */ this.offset = 0;
}

function NSVGgradient() {
  /* float */ this.xform = new Float32Array(6);
  /* char */ this.spread = 0;
  /* float */ this.fx = 0;
  /* float */ this.fy = 0;
  /* int */ this.nstops = 0;
  /* NSVGgradientStop */ this.stops = [ new NSVGgradientStop() ];
}

function NSVGpaint() {
  /* char */ this.type = 0;

  /* unsigned int */ this.color = 0;
  /* NSVGgradient */ this.gradient = null;
  ;
}

function NSVGpath() {
  /* float */ this.pts = new Float32Array(4);
  /* int */ this.npts = 0;
  /* char */ this.closed = 0;
  /* float */ this.bounds = new Float32Array(4);
  /* function NSVGpath() */ this.next = null;
}

function NSVGshape() {
  /* char */ this.id = "";
  /* char */ this.class = "";
  /* NSVGpaint */ this.fill = new NSVGpaint();
  /* NSVGpaint */ this.stroke = new NSVGpaint();
  /* float */ this.opacity = 0;
  /* float */ this.strokeWidth = 0;
  /* float */ this.strokeDashOffset = 0;
  /* float */ this.strokeDashArray = new Float32Array(8);
  /* char */ this.strokeDashCount = 0;
  /* char */ this.strokeLineJoin = 0;
  /* char */ this.strokeLineCap = 0;
  /* char */ this.fillRule = 0;
  /* unsigned char */ this.flags = 0;
  /* float */ this.bounds = new Float32Array(4);
  /* NSVGpath */ this.paths = null;
  /* function NSVGshape() */ this.next = null;
}

function NSVGimage() {
  /* float */ this.width = 0;
  /* float */ this.height = 0;
  /* NSVGshape */ this.shapes = null;
}

/* static */ /* int */ function nsvg__isspace(/* char */ c) {
  return strchr(" \t\n\v\f\r", c) != 0;
}

/* static */ /* int */ function nsvg__isdigit(/* char */ c) {
  return strchr("0123456789", c) != 0;
}

/* static */ /* int */ function nsvg__isnum(/* char */ c) {
  return strchr("0123456789+-.eE", c) != 0;
}

/* static */ /* float */ function nsvg__minf(/* float */ a, /* float */ b) {
  return a < b ? a : b;
}

/* static */ /* float */ function nsvg__maxf(/* float */ a, /* float */ b) {
  return a > b ? a : b;
}

///* static */ /* void */ function nsvg__parseContent(/* char */ s, /* void */
///function (contentCb)(/* void */ ud, /* const char */ s), /* void */ ud)
function nsvg__parseContent(s, s_idx, s_end, contentCb, ud) {
  while (s_idx < s_end && nsvg__isspace(s[s_idx]))
    s_idx++;

  if (!(s_idx < s_end))
    return;

  if (contentCb)
    contentCb(ud, s.substr(s_idx, s_end - s_idx));
}

///* static */ /* void */ function nsvg__parseElement(/* char */ s, /* void */
///function (startelCb)(/* void */ ud, /* const char */ el, /* const char */
///attr), /* void */ function (endelCb)(/* void */ ud, /* const char */ el), /*
///void */ ud)
function nsvg__parseElement(s, s_idx, s_end, startelCb, endelCb, ud) {
  var /* const char */ attr = [];
  var /* int */ nattr = 0;
  var /* char */ name = "";
  var /* int */ start = 0;
  var /* int */ end = 0;
  var /* char */ quote;
  while (s_idx < s_end && nsvg__isspace(s[s_idx]))
    s_idx++;

  if ((s[s_idx]) === '/') {
    s_idx++;
    end = 1;
  } else {
    start = 1;
  }

  if (((!(s_idx < s_end)) || ((s[s_idx]) === '?')) || ((s[s_idx]) === '!'))
    return;

  var namei = s_idx;
  while ((s_idx < s_end) && (!nsvg__isspace(s[s_idx])))
    s_idx++;

  name = s.substr(namei, s_idx - namei);

  while (((!end) && (s_idx < s_end)) && (nattr < (256 - 3))) {
    while ((s_idx < s_end) && nsvg__isspace(s[s_idx]))
      s_idx++;

    if (!(s_idx < s_end))
      break;

    if ((s[s_idx]) === '/') {
      end = 1;
      break;
    }

    var attri = s_idx;

    while (((s_idx < s_end) && (!nsvg__isspace(s[s_idx]))) &&
           ((s[s_idx]) != '='))
      s_idx++;

    if (s_idx < s_end) {
      attr[nattr++] = s.substr(attri, s_idx - attri);
      s_idx++;
    }

    while (((s[s_idx]) && ((s[s_idx]) != '\"')) && ((s[s_idx]) != '\''))
      s_idx++;

    if (!(s_idx < s_end))
      break;

    quote = s[s_idx];
    s_idx++;
    attri = s_idx;
    while ((s_idx < s_end) && ((s[s_idx]) != quote))
      s_idx++;

    if (s_idx < s_end) {
      attr[nattr++] = s.substr(attri, s_idx - attri);
      s_idx++;
    }
  }

  attr[nattr++] = 0;
  attr[nattr++] = 0;
  if (start && startelCb)
    (startelCb)(ud, name, attr);

  if (end && endelCb)
    (endelCb)(ud, name);
}

///* int */ function nsvg__parseXML(/* char */ input, /* void */ function
///(startelCb)(/* void */ ud, /* const char */ el, /* const char */ attr), /*
///void */ function (endelCb)(/* void */ ud, /* const char */ el), /* void */
///function (contentCb)(/* void */ ud, /* const char */ s), /* void */ ud)
function nsvg__parseXML(input, startelCb, endelCb, contentCb, ud) {
  var /* char */ s = input;
  var s_idx = 0;
  var /* char */ mark = 0;
  var /* int */ state = 2;
  while (s[s_idx]) {
    if (((s[s_idx]) === '<') && (state === 2)) {
      nsvg__parseContent(s, mark, s_idx, contentCb, ud);
      s_idx++;
      mark = s_idx;
      state = 1;
    } else if (((s[s_idx]) === '>') && (state === 1)) {
      nsvg__parseElement(s, mark, s_idx, startelCb, endelCb, ud);
      s_idx++;
      mark = s_idx;
      state = 2;
    } else {
      s_idx++;
    }
  }

  return 1;
}

function NSVGcoordinate(v, u) {
  /* float */ this.value = v || 0;
  /* int */ this.units = u || 0;
};
function NSVGlinearData() {
  /* NSVGcoordinate */ this.x1 = null;
  /* NSVGcoordinate */ this.y1 = null;
  /* NSVGcoordinate */ this.x2 = null;
  /* NSVGcoordinate */ this.y2 = null;
};
function NSVGradialData() {
  /* NSVGcoordinate */ this.cx = null;
  /* NSVGcoordinate */ this.cy = null;
  /* NSVGcoordinate */ this.r = null;
  /* NSVGcoordinate */ this.fx = null;
  /* NSVGcoordinate */ this.fy = null;
};
function NSVGgradientData() {
  /* char */ this.id = "";
  /* char */ this.ref = new Int8Array(64);
  /* char */ this.type = 0;

  /* NSVGlinearData */ this.linear = new NSVGlinearData();
  /* NSVGradialData */ this.radial = new NSVGradialData();

  /* char */ this.spread = 0;
  /* char */ this.units = 0;
  /* float */ this.xform = new Float32Array(6);
  /* int */ this.nstops = 0;
  /* NSVGgradientStop */ this.stops = null;
  /* function NSVGgradientData() */ this.next = null;
};
function NSVGattrib() {
  /* char */ this.id = "";
  /* char */ this.class = "";
  /* float */ this.xform = new Float32Array(6);
  /* unsigned int */ this.fillColor = 0;
  /* unsigned int */ this.strokeColor = 0;
  /* float */ this.opacity = 0;
  /* float */ this.fillOpacity = 0;
  /* float */ this.strokeOpacity = 0;
  /* char */ this.fillGradient = new Int8Array(64);
  /* char */ this.strokeGradient = new Int8Array(64);
  /* float */ this.strokeWidth = 0;
  /* float */ this.strokeDashOffset = 0;
  /* float */ this.strokeDashArray = new Float32Array(8);
  /* int */ this.strokeDashCount = 0;
  /* char */ this.strokeLineJoin = 0;
  /* char */ this.strokeLineCap = 0;
  /* char */ this.fillRule = 0;
  /* float */ this.fontSize = 0;
  /* unsigned int */ this.stopColor = 0;
  /* float */ this.stopOpacity = 0;
  /* float */ this.stopOffset = 0;
  /* char */ this.hasFill = 0;
  /* char */ this.hasStroke = 0;
  /* char */ this.visible = 0;
};
function NSVGparser() {
  /* NSVGattrib */ this.attr = makearr(256, NSVGattrib);
  /* int */ this.attrHead = 0;
  /* float */ this.pts = new Float32Array(4);
  /* int */ this.npts = 0;
  /* int */ this.cpts = 0;
  /* NSVGpath */ this.plist = null;
  /* NSVGimage */ this.image = null;
  /* NSVGgradientData */ this.gradients = null;
  /* float */ this.viewMinx = 0;
  /* float */ this.viewMiny = 0;
  /* float */ this.viewWidth = 0;
  /* float */ this.viewHeight = 0;
  /* int */ this.alignX = 0;
  /* int */ this.alignY = 0;
  /* int */ this.alignType = 0;
  /* float */ this.dpi = 0;
  /* char */ this.pathFlag = 0;
  /* char */ this.defsFlag = 0;
  /* char */ this.styleFlag = 0;
  this.styles = { };
};
/* static */ /* void */ function nsvg__xformIdentity(/* float */ t) {
  t[0] = 1.0;
  t[1] = 0.0;
  t[2] = 0.0;
  t[3] = 1.0;
  t[4] = 0.0;
  t[5] = 0.0;
}

/* static */ /* void */ function nsvg__xformSetTranslation(
    /* float */ t, /* float */ tx, /* float */ ty) {
  t[0] = 1.0;
  t[1] = 0.0;
  t[2] = 0.0;
  t[3] = 1.0;
  t[4] = tx;
  t[5] = ty;
}

/* static */ /* void */ function nsvg__xformSetScale(
    /* float */ t, /* float */ sx, /* float */ sy) {
  t[0] = sx;
  t[1] = 0.0;
  t[2] = 0.0;
  t[3] = sy;
  t[4] = 0.0;
  t[5] = 0.0;
}

/* static */ /* void */ function nsvg__xformSetSkewX(/* float */ t,
                                                     /* float */ a) {
  t[0] = 1.0;
  t[1] = 0.0;
  t[2] = tanf(a);
  t[3] = 1.0;
  t[4] = 0.0;
  t[5] = 0.0;
}

/* static */ /* void */ function nsvg__xformSetSkewY(/* float */ t,
                                                     /* float */ a) {
  t[0] = 1.0;
  t[1] = tanf(a);
  t[2] = 0.0;
  t[3] = 1.0;
  t[4] = 0.0;
  t[5] = 0.0;
}

/* static */ /* void */ function nsvg__xformSetRotation(/* float */ t,
                                                        /* float */ a) {
  var /* float */ cs = cosf(a);
  var /* float */ sn = sinf(a);
  t[0] = cs;
  t[1] = sn;
  t[2] = -sn;
  t[3] = cs;
  t[4] = 0.0;
  t[5] = 0.0;
}

/* static */ /* void */ function nsvg__xformMultiply(/* float */ t,
                                                     /* float */ s) {
  var /* float */ t0 = (t[0] * s[0]) + (t[1] * s[2]);
  var /* float */ t2 = (t[2] * s[0]) + (t[3] * s[2]);
  var /* float */ t4 = ((t[4] * s[0]) + (t[5] * s[2])) + s[4];
  t[1] = (t[0] * s[1]) + (t[1] * s[3]);
  t[3] = (t[2] * s[1]) + (t[3] * s[3]);
  t[5] = ((t[4] * s[1]) + (t[5] * s[3])) + s[5];
  t[0] = t0;
  t[2] = t2;
  t[4] = t4;
}

/* static */ /* void */ function nsvg__xformInverse(/* float */ inv,
                                                    /* float */ t) {
  var /* double */ invdet;
  var /* double */ det = ((t[0]) * t[3]) - ((t[2]) * t[1]);
  if ((det > (-1e-6)) && (det < 1e-6)) {
    nsvg__xformIdentity(t);
    return;
  }

  invdet = 1.0 / det;
  inv[0] = (t[3] * invdet);
  inv[2] = ((-t[2]) * invdet);
  inv[4] = ((((t[2]) * t[5]) - ((t[3]) * t[4])) * invdet);
  inv[1] = ((-t[1]) * invdet);
  inv[3] = (t[0] * invdet);
  inv[5] = ((((t[1]) * t[4]) - ((t[0]) * t[5])) * invdet);
}

/* static */ /* void */ function nsvg__xformPremultiply(/* float */ t,
                                                        /* float */ s) {
  var /* float */ s2 = new Float32Array(6);
  arrcpy(s2, s);
  nsvg__xformMultiply(s2, t);
  arrcpy(t, s2);
}

/* static */ /* void */ function nsvg__xformPoint(
    /* float */ dx, /* float */ dy, /* float */ x, /* float */ y,
    /* float */ t) {
  /*
    *dx = ((x * t[0]) + (y * t[2])) + t[4];
    *dy = ((x * t[1]) + (y * t[3])) + t[5];
  */
  throw 'xxx';
}

/* static */ /* void */ function nsvg__xformVec(/* float */ dx, /* float */ dy,
                                                /* float */ x, /* float */ y,
                                                /* float */ t) {
  /*
  *dx = (x * t[0]) + (y * t[2]);
  *dy = (x * t[1]) + (y * t[3]);
  */
  throw 'xxx';
}

/* static */ /* int */ function nsvg__ptInBounds(/* float */ pt,
                                                 /* float */ bounds) {
  return (((pt[0] >= bounds[0]) && (pt[0] <= bounds[2])) &&
          (pt[1] >= bounds[1])) &&
         (pt[1] <= bounds[3]);
}

/* static */ /* double */ function nsvg__evalBezier(
    /* double */ t, /* double */ p0, /* double */ p1, /* double */ p2,
    /* double */ p3) {
  var /* double */ it = 1.0 - t;
  return (((((it * it) * it) * p0) + ((((3.0 * it) * it) * t) * p1)) +
          ((((3.0 * it) * t) * t) * p2)) +
         (((t * t) * t) * p3);
}

/* static */ /* void */ function nsvg__curveBounds(/* float */ bounds,
                                                   /* float */ curve) {
  var /* int */ i;
  var /* int */ j;
  var /* int */ count;
  var /* double */ roots = new Float32Array(2);
  var /* double */ a;
  var /* double */ b;
  var /* double */ c;
  var /* double */ b2ac;
  var /* double */ t;
  var /* double */ v;
  var /* float */ v0 = curve.slice(0);
  var /* float */ v1 = curve.slice(2);
  var /* float */ v2 = curve.slice(4);
  var /* float */ v3 = curve.slice(6);
  bounds[0] = nsvg__minf(v0[0], v3[0]);
  bounds[1] = nsvg__minf(v0[1], v3[1]);
  bounds[2] = nsvg__maxf(v0[0], v3[0]);
  bounds[3] = nsvg__maxf(v0[1], v3[1]);
  if (nsvg__ptInBounds(v1, bounds) && nsvg__ptInBounds(v2, bounds))
    return;

  for (i = 0; i < 2; i++) {
    a = ((((-3.0) * v0[i]) + (9.0 * v1[i])) - (9.0 * v2[i])) + (3.0 * v3[i]);
    b = ((6.0 * v0[i]) - (12.0 * v1[i])) + (6.0 * v2[i]);
    c = (3.0 * v1[i]) - (3.0 * v0[i]);
    count = 0;
    if (fabs(a) < 1e-12) {
      if (fabs(b) > 1e-12) {
        t = (-c) / b;
        if ((t > 1e-12) && (t < (1.0 - 1e-12)))
          roots[count++] = t;
      }

    } else {
      b2ac = (b * b) - ((4.0 * c) * a);
      if (b2ac > 1e-12) {
        t = ((-b) + sqrt(b2ac)) / (2.0 * a);
        if ((t > 1e-12) && (t < (1.0 - 1e-12)))
          roots[count++] = t;

        t = ((-b) - sqrt(b2ac)) / (2.0 * a);
        if ((t > 1e-12) && (t < (1.0 - 1e-12)))
          roots[count++] = t;
      }
    }

    for (j = 0; j < count; j++) {
      v = nsvg__evalBezier(roots[j], v0[i], v1[i], v2[i], v3[i]);
      bounds[0 + i] = nsvg__minf(bounds[0 + i], v);
      bounds[2 + i] = nsvg__maxf(bounds[2 + i], v);
    }
  }
}

/* static */ /* NSVGparser */ function nsvg__createParser() {
  var /* NSVGparser */ p = new NSVGparser();

  p.image = new NSVGimage();

  nsvg__xformIdentity(p.attr[0].xform);
  p.attr[0].id = "";
  p.attr[0].class = "";
  p.attr[0].fillColor = 0;
  p.attr[0].strokeColor = 0;
  p.attr[0].opacity = 1;
  p.attr[0].fillOpacity = 1;
  p.attr[0].strokeOpacity = 1;
  p.attr[0].stopOpacity = 1;
  p.attr[0].strokeWidth = 1;
  p.attr[0].strokeLineJoin = 0 /* NSVG_JOIN_MITER */;
  p.attr[0].strokeLineCap = 0 /* NSVG_CAP_BUTT */;
  p.attr[0].fillRule = 0 /* NSVG_FILLRULE_NONZERO */;
  p.attr[0].hasFill = 1;
  p.attr[0].visible = 1;
  return p;
}

/* static */ /* void */ function nsvg__resetPath(/* NSVGparser */ p) {
  p.npts = 0;
}

/* static */ /* void */ function nsvg__addPoint(/* NSVGparser */ p,
                                                /* float */ x, /* float */ y) {
  if ((p.npts + 1) > p.cpts) {
    p.cpts = p.cpts ? p.cpts * 2 : 8;
    p.pts = realloc(p.pts, p.cpts * 2, Float32Array);
  }

  p.pts[(p.npts * 2) + 0] = x;
  p.pts[(p.npts * 2) + 1] = y;
  p.npts++;
}

/* static */ /* void */ function nsvg__moveTo(/* NSVGparser */ p, /* float */ x,
                                              /* float */ y) {
  if (p.npts > 0) {
    p.pts[((p.npts - 1) * 2) + 0] = x;
    p.pts[((p.npts - 1) * 2) + 1] = y;
  } else {
    nsvg__addPoint(p, x, y);
  }
}

/* static */ /* void */ function nsvg__lineTo(/* NSVGparser */ p, /* float */ x,
                                              /* float */ y) {
  var /* float */ px;
  var /* float */ py;
  var /* float */ dx;
  var /* float */ dy;
  if (p.npts > 0) {
    px = p.pts[((p.npts - 1) * 2) + 0];
    py = p.pts[((p.npts - 1) * 2) + 1];
    dx = x - px;
    dy = y - py;
    nsvg__addPoint(p, px + (dx / 3.0), py + (dy / 3.0));
    nsvg__addPoint(p, x - (dx / 3.0), y - (dy / 3.0));
    nsvg__addPoint(p, x, y);
  }
}

/* static */ /* void */ function nsvg__cubicBezTo(
    /* NSVGparser */ p, /* float */ cpx1, /* float */ cpy1, /* float */ cpx2,
    /* float */ cpy2, /* float */ x, /* float */ y) {
  nsvg__addPoint(p, cpx1, cpy1);
  nsvg__addPoint(p, cpx2, cpy2);
  nsvg__addPoint(p, x, y);
}

/* static */ /* NSVGattrib */ function nsvg__getAttr(/* NSVGparser */ p) {
  return p.attr[p.attrHead];
}

/* static */ /* void */ function nsvg__pushAttr(/* NSVGparser */ p) {
  if (p.attrHead < (128 - 1)) {
    p.attrHead++;
    // memcpy(&p.attr[p.attrHead], &p.attr[p.attrHead - 1], sizeof);
    var a = p.attr[p.attrHead], b = p.attr[p.attrHead - 1];
    ///* char */ a.id = b.id;
    a.id = "";
    a.class = "";
    /* float */ a.xform = b.xform.slice();
    /* unsigned int */ a.fillColor = b.fillColor;
    /* unsigned int */ a.strokeColor = b.strokeColor;
    /* float */ a.opacity = b.opacity;
    /* float */ a.fillOpacity = b.fillOpacity;
    /* float */ a.strokeOpacity = b.strokeOpacity;
    /* char */ a.fillGradient = b.fillGradient.slice();
    /* char */ a.strokeGradient = b.strokeGradient.slice();
    /* float */ a.strokeWidth = b.strokeWidth;
    /* float */ a.strokeDashOffset = b.strokeDashOffset;
    /* float */ a.strokeDashArray = b.strokeDashArray.slice();
    /* int */ a.strokeDashCount = b.strokeDashCount;
    /* char */ a.strokeLineJoin = b.strokeLineJoin;
    /* char */ a.strokeLineCap = b.strokeLineCap;
    /* char */ a.fillRule = b.fillRule;
    /* float */ a.fontSize = b.fontSize;
    /* unsigned int */ a.stopColor = b.stopColor;
    /* float */ a.stopOpacity = b.stopOpacity;
    /* float */ a.stopOffset = b.stopOffset;
    /* char */ a.hasFill = b.hasFill;
    /* char */ a.hasStroke = b.hasStroke;
    /* char */ a.visible = b.visible;
  } else {
    throw 'overflow in pushAttr: ' + p.attrHead;
  }
}

/* static */ /* void */ function nsvg__popAttr(/* NSVGparser */ p) {
  if (p.attrHead > 0)
    p.attrHead--;
}

/* static */ /* float */ function nsvg__actualOrigX(/* NSVGparser */ p) {
  return p.viewMinx;
}

/* static */ /* float */ function nsvg__actualOrigY(/* NSVGparser */ p) {
  return p.viewMiny;
}

/* static */ /* float */ function nsvg__actualWidth(/* NSVGparser */ p) {
  return p.viewWidth;
}

/* static */ /* float */ function nsvg__actualHeight(/* NSVGparser */ p) {
  return p.viewHeight;
}

/* static */ /* float */ function nsvg__actualLength(/* NSVGparser */ p) {
  var /* float */ w = nsvg__actualWidth(p);
  var /* float */ h = nsvg__actualHeight(p);
  return sqrtf((w * w) + (h * h)) / sqrtf(2.0);
}

/* static */ /* float */ function nsvg__convertToPixels(
    /* NSVGparser */ p, /* NSVGcoordinate */ c, /* float */ orig,
    /* float */ length) {
  var /* NSVGattrib */ attr = nsvg__getAttr(p);
  switch (c.units) {
  case 0 /* NSVG_UNITS_USER */:
    return c.value;

  case 1 /* NSVG_UNITS_PX */:
    return c.value;

  case 2 /* NSVG_UNITS_PT */:
    return (c.value / 72.0) * p.dpi;

  case 3 /* NSVG_UNITS_PC */:
    return (c.value / 6.0) * p.dpi;

  case 4 /* NSVG_UNITS_MM */:
    return (c.value / 25.4) * p.dpi;

  case 5 /* NSVG_UNITS_CM */:
    return (c.value / 2.54) * p.dpi;

  case 6 /* NSVG_UNITS_IN */:
    return c.value * p.dpi;

  case 8 /* NSVG_UNITS_EM */:
    return c.value * attr.fontSize;

  case 9 /* NSVG_UNITS_EX */:
    return (c.value * attr.fontSize) * 0.52;

  case 7 /* NSVG_UNITS_PERCENT */:
    return orig + ((c.value / 100.0) * length);

  default:
    return c.value;
  }

  return c.value;
}

/* static */ /* NSVGgradientData */ function nsvg__findGradientData(
    /* NSVGparser */ p, /* const char */ id) {
  var /* NSVGgradientData */ grad = p.gradients;
  while (grad) {
    if (grad.id === id)
      return grad;

    grad = grad.next;
  }

  return 0;
}

/* static */ /* NSVGgradient */ function nsvg__createGradient(
    /* NSVGparser */ p, /* const char */ id, /* const float */ localBounds,
    /* char */ paintType) {
  var /* NSVGattrib */ attr = nsvg__getAttr(p);
  var /* NSVGgradientData */ data = 0;
  var /* NSVGgradientData */ ref = 0;
  var /* NSVGgradientStop */ stops = 0;
  var /* NSVGgradient */ grad;
  var /* float */ ox;
  var /* float */ oy;
  var /* float */ sw;
  var /* float */ sh;
  var /* float */ sl;
  var /* int */ nstops = 0;
  data = nsvg__findGradientData(p, id);
  if (data === 0)
    return 0;

  ref = data;
  while (ref != null) {
    if ((stops === null) && (ref.stops != null)) {
      stops = ref.stops;
      nstops = ref.nstops;
      break;
    }

    ref = nsvg__findGradientData(p, ref.ref);
  }

  if (stops === null)
    return 0;

  // grad =  malloc((sizeof) + ((sizeof) * (nstops - 1)));
  if (grad === null)
    return 0;

  if (data.units === 1 /* NSVG_OBJECT_SPACE */) {
    ox = localBounds[0];
    oy = localBounds[1];
    sw = localBounds[2] - localBounds[0];
    sh = localBounds[3] - localBounds[1];
  } else {
    ox = nsvg__actualOrigX(p);
    oy = nsvg__actualOrigY(p);
    sw = nsvg__actualWidth(p);
    sh = nsvg__actualHeight(p);
  }

  sl = sqrtf((sw * sw) + (sh * sh)) / sqrtf(2.0);
  if (data.type === 2 /* NSVG_PAINT_LINEAR_GRADIENT */) {
    var /* float */ x1;
    var /* float */ y1;
    var /* float */ x2;
    var /* float */ y2;
    var /* float */ dx;
    var /* float */ dy;
    x1 = nsvg__convertToPixels(p, data.linear.x1, ox, sw);
    y1 = nsvg__convertToPixels(p, data.linear.y1, oy, sh);
    x2 = nsvg__convertToPixels(p, data.linear.x2, ox, sw);
    y2 = nsvg__convertToPixels(p, data.linear.y2, oy, sh);
    dx = x2 - x1;
    dy = y2 - y1;
    grad.xform[0] = dy;
    grad.xform[1] = -dx;
    grad.xform[2] = dx;
    grad.xform[3] = dy;
    grad.xform[4] = x1;
    grad.xform[5] = y1;
  } else {
    var /* float */ cx;
    var /* float */ cy;
    var /* float */ fx;
    var /* float */ fy;
    var /* float */ r;
    cx = nsvg__convertToPixels(p, data.radial.cx, ox, sw);
    cy = nsvg__convertToPixels(p, data.radial.cy, oy, sh);
    fx = nsvg__convertToPixels(p, data.radial.fx, ox, sw);
    fy = nsvg__convertToPixels(p, data.radial.fy, oy, sh);
    r = nsvg__convertToPixels(p, data.radial.r, 0, sl);
    grad.xform[0] = r;
    grad.xform[1] = 0;
    grad.xform[2] = 0;
    grad.xform[3] = r;
    grad.xform[4] = cx;
    grad.xform[5] = cy;
    grad.fx = fx / r;
    grad.fy = fy / r;
  }

  nsvg__xformMultiply(grad.xform, data.xform);
  nsvg__xformMultiply(grad.xform, attr.xform);
  grad.spread = data.spread;
  memcpy(grad.stops, stops, nstops * (sizeof));
  grad.nstops = nstops;
  //*paintType = data.type;
  return grad;
}

/* static */ /* float */ function nsvg__getAverageScale(/* float */ t) {
  var /* float */ sx = sqrtf((t[0] * t[0]) + (t[2] * t[2]));
  var /* float */ sy = sqrtf((t[1] * t[1]) + (t[3] * t[3]));
  return (sx + sy) * 0.5;
}

/* static */ /* void */ function nsvg__getLocalBounds(
    /* float */ bounds, /* NSVGshape */ shape, /* float */ xform) {
  var /* NSVGpath */ path;
  var /* float */ curve = new Float32Array(4 * 2);
  var /* float */ curveBounds = new Float32Array(4);
  var /* int */ i;
  var /* int */ first = 1;
  for (path = shape.paths; path != null; path = path.next) {
    // nsvg__xformPoint(&curve[0], &curve[1], path.pts[0], path.pts[1], xform);
    curve[0] = path.pts[0] * xform[0] + path.pts[1] * xform[2] + xform[4];
    curve[1] = path.pts[0] * xform[1] + path.pts[1] * xform[3] + xform[5];
    for (i = 0; i < (path.npts - 1); i += 3) {
      // nsvg__xformPoint(&curve[2], &curve[3], path.pts[(i + 1) * 2],
      // path.pts[((i + 1) * 2) + 1], xform);
      curve[2] = path.pts[(i + 1) * 2    ] * xform[0] +
                 path.pts[(i + 1) * 2 + 1] * xform[2] +
                 xform[4];
      curve[3] = path.pts[(i + 1) * 2    ] * xform[1] +
                 path.pts[(i + 1) * 2 + 1] * xform[3] +
                 xform[5];
      // nsvg__xformPoint(&curve[4], &curve[5], path.pts[(i + 2) * 2],
      // path.pts[((i + 2) * 2) + 1], xform);
      curve[4] = path.pts[(i + 2) * 2    ] * xform[0] +
                 path.pts[(i + 2) * 2 + 1] * xform[2] +
                 xform[4];
      curve[5] = path.pts[(i + 2) * 2    ] * xform[1] +
                 path.pts[(i + 2) * 2 + 1] * xform[3] +
                 xform[5];
      // nsvg__xformPoint(&curve[6], &curve[7], path.pts[(i + 3) * 2],
      // path.pts[((i + 3) * 2) + 1], xform);
      curve[6] = path.pts[(i + 3) * 2    ] * xform[0] +
                 path.pts[(i + 3) * 2 + 1] * xform[2] +
                 xform[4];
      curve[7] = path.pts[(i + 3) * 2    ] * xform[1] +
                 path.pts[(i + 3) * 2 + 1] * xform[3] +
                 xform[5];
      nsvg__curveBounds(curveBounds, curve);
      if (first) {
        bounds[0] = curveBounds[0];
        bounds[1] = curveBounds[1];
        bounds[2] = curveBounds[2];
        bounds[3] = curveBounds[3];
        first = 0;
      } else {
        bounds[0] = nsvg__minf(bounds[0], curveBounds[0]);
        bounds[1] = nsvg__minf(bounds[1], curveBounds[1]);
        bounds[2] = nsvg__maxf(bounds[2], curveBounds[2]);
        bounds[3] = nsvg__maxf(bounds[3], curveBounds[3]);
      }

      curve[0] = curve[6];
      curve[1] = curve[7];
    }
  }
}

/* static */ /* void */ function nsvg__addShape(/* NSVGparser */ p) {
  var /* NSVGattrib */ attr = nsvg__getAttr(p);
  var /* float */ scale = 1.0;
  var /* NSVGshape */ shape;
  var /* NSVGshape */ cur;
  var /* NSVGshape */ prev;
  var /* NSVGpath */ path;
  var /* int */ i;
  if (p.plist === null)
    return;

  shape = new NSVGshape();
  // memcpy(shape.id, attr.id, sizeof(shape.id));
  shape.id = attr.id;
  shape.class = attr.class;
  scale = nsvg__getAverageScale(attr.xform);
  shape.strokeWidth = attr.strokeWidth * scale;
  shape.strokeDashOffset = attr.strokeDashOffset * scale;
  shape.strokeDashCount = attr.strokeDashCount;
  for (i = 0; i < attr.strokeDashCount; i++)
    shape.strokeDashArray[i] = attr.strokeDashArray[i] * scale;

  shape.strokeLineJoin = attr.strokeLineJoin;
  shape.strokeLineCap = attr.strokeLineCap;
  shape.fillRule = attr.fillRule;
  shape.opacity = attr.opacity;
  shape.paths = p.plist;
  p.plist = null;
  shape.bounds[0] = shape.paths.bounds[0];
  shape.bounds[1] = shape.paths.bounds[1];
  shape.bounds[2] = shape.paths.bounds[2];
  shape.bounds[3] = shape.paths.bounds[3];
  for (path = shape.paths.next; path != null; path = path.next) {
    shape.bounds[0] = nsvg__minf(shape.bounds[0], path.bounds[0]);
    shape.bounds[1] = nsvg__minf(shape.bounds[1], path.bounds[1]);
    shape.bounds[2] = nsvg__maxf(shape.bounds[2], path.bounds[2]);
    shape.bounds[3] = nsvg__maxf(shape.bounds[3], path.bounds[3]);
  }

  if (attr.hasFill === 0) {
    shape.fill.type = 0 /* NSVG_PAINT_NONE */;
  } else if (attr.hasFill === 1) {
    shape.fill.type = 1 /* NSVG_PAINT_COLOR */;
    shape.fill.color = orsl24(attr.fillColor, attr.fillOpacity * 255);
  } else if (attr.hasFill === 2) {
    var /* float */ inv = new Float32Array(6);
    var /* float */ localBounds = new Float32Array(4);
    nsvg__xformInverse(inv, attr.xform);
    nsvg__getLocalBounds(localBounds, shape, inv);
    // shape.fill.gradient = nsvg__createGradient(p, attr.fillGradient,
    // localBounds, &shape.fill.type);
    if (shape.fill.gradient === 0) {
      shape.fill.type = 0 /* NSVG_PAINT_NONE */;
    }
  }

  if (attr.hasStroke === 0) {
    shape.stroke.type = 0 /* NSVG_PAINT_NONE */;
  } else if (attr.hasStroke === 1) {
    shape.stroke.type = 1 /* NSVG_PAINT_COLOR */;
    shape.stroke.color = orsl24(attr.strokeColor, attr.strokeOpacity * 255);
  } else if (attr.hasStroke === 2) {
    var /* float */ inv = new Float32Array(6);
    var /* float */ localBounds = new Float32Array(4);
    nsvg__xformInverse(inv, attr.xform);
    nsvg__getLocalBounds(localBounds, shape, inv);
    // shape.stroke.gradient = nsvg__createGradient(p, attr.strokeGradient,
    // localBounds, &shape.stroke.type);
    if (shape.stroke.gradient === 0)
      shape.stroke.type = 0 /* NSVG_PAINT_NONE */;
  }

  shape.flags = attr.visible ? 1 /* NSVG_FLAGS_VISIBLE */ : 0x00;
  prev = null;
  cur = p.image.shapes;
  while (cur != null) {
    prev = cur;
    cur = cur.next;
  }

  if (prev === null)
    p.image.shapes = shape;
  else
    prev.next = shape;

  return;
}

/* static */ /* void */ function nsvg__addPath(/* NSVGparser */ p,
                                               /* char */ closed) {
  var /* NSVGattrib */ attr = nsvg__getAttr(p);
  var /* NSVGpath */ path = 0;
  var /* float */ bounds = new Float32Array(4);
  var /* float */ curve;
  var /* int */ i;
  if (p.npts < 4)
    return;

  if (closed)
    nsvg__lineTo(p, p.pts[0], p.pts[1]);

  path = new NSVGpath();
  path.pts = new Float32Array(p.npts * 2);

  path.closed = closed;
  path.npts = p.npts;

  for (i = 0; i < p.npts; ++i) {
    // nsvg__xformPoint(&path.pts[i * 2], &path.pts[(i * 2) + 1], p.pts[i * 2],
    // p.pts[(i * 2) + 1], attr.xform);
    var tx = p.pts[i * 2    ] * attr.xform[0] +
             p.pts[i * 2 + 1] * attr.xform[2] +
             attr.xform[4];
    var ty = p.pts[i * 2    ] * attr.xform[1] +
             p.pts[i * 2 + 1] * attr.xform[3] +
             attr.xform[5];
    path.pts[i * 2    ] = tx;
    path.pts[i * 2 + 1] = ty;
  }

  for (i = 0; i < (path.npts - 1); i += 3) {
    curve = path.pts.slice(i * 2);
    nsvg__curveBounds(bounds, curve);
    if (i === 0) {
      path.bounds[0] = bounds[0];
      path.bounds[1] = bounds[1];
      path.bounds[2] = bounds[2];
      path.bounds[3] = bounds[3];
    } else {
      path.bounds[0] = nsvg__minf(path.bounds[0], bounds[0]);
      path.bounds[1] = nsvg__minf(path.bounds[1], bounds[1]);
      path.bounds[2] = nsvg__maxf(path.bounds[2], bounds[2]);
      path.bounds[3] = nsvg__maxf(path.bounds[3], bounds[3]);
    }
  }

  path.next = p.plist;
  p.plist = path;
  return;
}

/* static */ /* const char */ function nsvg__parseNumber(/* const char */ s) {
  var it = "";
  var s_idx = 0;

  if (s[s_idx] === '-' || s[s_idx] === '+') {
    it += s[s_idx];
    s_idx++;
  }

  while (s[s_idx] && nsvg__isdigit(s[s_idx])) {
    it += s[s_idx];
    s_idx++;
  }

  if (s[s_idx] === '.') {
    it += s[s_idx];

    s_idx++;
    while (s[s_idx] && nsvg__isdigit(s[s_idx])) {
      it += s[s_idx];

      s_idx++;
    }
  }

  if (((s[s_idx]) === 'e') || ((s[s_idx]) === 'E')) {
    it += s[s_idx];

    s_idx++;
    if (((s[s_idx]) === '-') || ((s[s_idx]) === '+')) {
      it += s[s_idx];

      s_idx++;
    }

    while ((s[s_idx]) && nsvg__isdigit(s[s_idx])) {
      it += s[s_idx];

      s_idx++;
    }
  }

  return {s_idx : s_idx, it : it};
}

/* static */ /* const char */ function nsvg__getNextPathItem(
    /* const char */ s) {
  var it = "";
  var s_idx = 0;
  while ((s[s_idx]) && (nsvg__isspace(s[s_idx]) || ((s[s_idx]) === ',')))
    s_idx++;

  if (!(s[s_idx]))
    return {s_idx : s_idx, it : it};

  if (((((s[s_idx]) === '-') || ((s[s_idx]) === '+')) ||
       ((s[s_idx]) === '.')) ||
      nsvg__isdigit(s[s_idx])) {
    var res = nsvg__parseNumber(s.substr(s_idx));
    s_idx += res.s_idx;
    it = res.it;
  } else {
    it = s[s_idx++];
    return {s_idx : s_idx, it : it};
  }

  return {s_idx : s_idx, it : it};
}

// NOTE(deanm): Replacement implemtnation using css-color-parser.
/* static */ /* unsigned int */ function nsvg__parseColor(
    /* const char */ str) {
  var rgba = parseCSSColor(str);
  if (rgba === null) throw 'Unable to parse color: ' + str;
  // NOTE(deanm): NanoSVG doesn't seem to support alpha in colors (not sure about SVG spec).
  if (rgba[3] !== 1) throw 'Color has alpha: ' + str;
  return rgba[0] | rgba[1] << 8 | rgba[2] << 16;
}

/* static */ /* float */ function nsvg__parseOpacity(/* const char */ str) {
  var /* float */ val = 0;
  // sscanf(str, "%f", &val);
  val = parseFloat(str);
  if (val < 0.0)
    val = 0.0;

  if (val > 1.0)
    val = 1.0;

  return val;
}

/* static */ /* int */ function nsvg__parseUnits(/* const char */ units) {
  if ((units[0] === 'p') && (units[1] === 'x'))
    return 1 /* NSVG_UNITS_PX */;
  else if ((units[0] === 'p') && (units[1] === 't'))
    return 2 /* NSVG_UNITS_PT */;
  else if ((units[0] === 'p') && (units[1] === 'c'))
    return 3 /* NSVG_UNITS_PC */;
  else if ((units[0] === 'm') && (units[1] === 'm'))
    return 4 /* NSVG_UNITS_MM */;
  else if ((units[0] === 'c') && (units[1] === 'm'))
    return 5 /* NSVG_UNITS_CM */;
  else if ((units[0] === 'i') && (units[1] === 'n'))
    return 6 /* NSVG_UNITS_IN */;
  else if (units[0] === '%')
    return 7 /* NSVG_UNITS_PERCENT */;
  else if ((units[0] === 'e') && (units[1] === 'm'))
    return 8 /* NSVG_UNITS_EM */;
  else if ((units[0] === 'e') && (units[1] === 'x'))
    return 9 /* NSVG_UNITS_EX */;

  return 0 /* NSVG_UNITS_USER */;
}

/* static */ /* NSVGcoordinate */ function nsvg__parseCoordinateRaw(
    /* const char */ str) {
  var /* NSVGcoordinate */ coord =
      new NSVGcoordinate(0, 0 /* NSVG_UNITS_USER */);
  var units = last_index_of_chars(str, "0123456789.");
  if (units === -1)
    throw 'No units in coordinate: ' + str;
  ++units;
  coord.value = parseFloat(str.substr(0, units));
  coord.units = nsvg__parseUnits(str.substr(units));
  return coord;
}

/* static */ /* NSVGcoordinate */ function nsvg__coord(/* float */ v,
                                                       /* int */ units) {
  var /* NSVGcoordinate */ coord = new NSVGcoordinate(v, units);
  return coord;
}

/* static */ /* float */ function nsvg__parseCoordinate(
    /* NSVGparser */ p, /* const char */ str, /* float */ orig,
    /* float */ length) {
  var /* NSVGcoordinate */ coord = nsvg__parseCoordinateRaw(str);
  return nsvg__convertToPixels(p, coord, orig, length);
}

/* static */ /* int */ function nsvg__parseTransformArgs(
    /* const char */ str, /* float */ args, /* int */ maxNa) {
  var /* const char */ end;
  var /* const char */ ptr;
  // var /* char */ it[64];
  var na = 0;

  ptr = 0;
  while (str[ptr] && (str[ptr] != '('))
    ++ptr;

  if (!str[ptr])
    return {len : 1, na : na};

  end = ptr;
  while (str[end] && (str[end] != ')'))
    ++end;

  if (!str[end])
    return {len : 1, na : na};

  while (ptr < end) {
    if (str[ptr] === '-' || str[ptr] === '+' || str[ptr] === '.' ||
        nsvg__isdigit(str[ptr])) {
      if (na >= maxNa)
        return {len : 0, na : na};

      var res = nsvg__parseNumber(str.substr(ptr));
      args[na++] = parseFloat(res.it);
      ptr += res.s_idx;
    } else {
      ++ptr;
    }
  }

  return {len : end, na : na};
}

/* static */ /* int */ function nsvg__parseMatrix(/* float */ xform,
                                                  /* const char */ str) {
  var /* float */ t = new Float32Array(6);
  var /* int */ na = 0;
  var res = nsvg__parseTransformArgs(str, t, 6);
  if (res.na != 6)
    return res.len;

  arrcpy(xform, t);
  return res.len;
}

/* static */ /* int */ function nsvg__parseTranslate(/* float */ xform,
                                                     /* const char */ str) {
  var /* float */ args = new Float32Array(2);
  var /* float */ t = new Float32Array(6);
  var res = nsvg__parseTransformArgs(str, args, 2);
  if (res.na === 1)
    args[1] = 0.0;

  nsvg__xformSetTranslation(t, args[0], args[1]);
  arrcpy(xform, t);
  return res.len;
}

/* static */ /* int */ function nsvg__parseScale(/* float */ xform,
                                                 /* const char */ str) {
  var /* float */ args = new Float32Array(2);
  var /* float */ t = new Float32Array(6);
  var res = nsvg__parseTransformArgs(str, args, 2);
  if (res.na === 1)
    args[1] = args[0];

  nsvg__xformSetScale(t, args[0], args[1]);
  arrcpy(xform, t);
  return res.len;
}

/* static */ /* int */ function nsvg__parseSkewX(/* float */ xform,
                                                 /* const char */ str) {
  var /* float */ args = new Float32Array(1);
  var /* float */ t = new Float32Array(6);
  var res = nsvg__parseTransformArgs(str, args, 1);
  nsvg__xformSetSkewX(t, (args[0] / 180.0) * 3.14159265358979323846264338327);
  arrcpy(xform, t);
  return res.len;
}

/* static */ /* int */ function nsvg__parseSkewY(/* float */ xform,
                                                 /* const char */ str) {
  var /* float */ args = new Float32Array(1);
  var /* float */ t = new Float32Array(6);
  var res = nsvg__parseTransformArgs(str, args, 1);
  nsvg__xformSetSkewY(t, (args[0] / 180.0) * 3.14159265358979323846264338327);
  arrcpy(xform, t);
  return res.len;
}

/* static */ /* int */ function nsvg__parseRotate(/* float */ xform,
                                                  /* const char */ str) {
  var /* float */ args = new Float32Array(3);
  var /* float */ m = new Float32Array(6);
  var /* float */ t = new Float32Array(6);
  var res = nsvg__parseTransformArgs(str, args, 3);
  if (res.na === 1)
    args[1] = (args[2] = 0.0);

  nsvg__xformIdentity(m);
  if (res.na > 1) {
    nsvg__xformSetTranslation(t, -args[1], -args[2]);
    nsvg__xformMultiply(m, t);
  }

  nsvg__xformSetRotation(t,
                         (args[0] / 180.0) * 3.14159265358979323846264338327);
  nsvg__xformMultiply(m, t);
  if (res.na > 1) {
    nsvg__xformSetTranslation(t, args[1], args[2]);
    nsvg__xformMultiply(m, t);
  }

  arrcpy(xform, m);
  return res.len;
}

/* static */ /* void */ function nsvg__parseTransform(/* float */ xform,
                                                      /* const char */ str) {
  var str_idx = 0;
  var /* float */ t = new Float32Array(6);
  nsvg__xformIdentity(xform);
  while (str[str_idx]) {
    if (str.substr(str_idx, 6) === "matrix")
      str_idx += nsvg__parseMatrix(t, str.substr(str_idx));
    else if (str.substr(str_idx, 9) === "translate")
      str_idx += nsvg__parseTranslate(t, str.substr(str_idx));
    else if (str.substr(str_idx, 5) === "scale")
      str_idx += nsvg__parseScale(t, str.substr(str_idx));
    else if (str.substr(str_idx, 6) === "rotate")
      str_idx += nsvg__parseRotate(t, str.substr(str_idx));
    else if (str.substr(str_idx, 5) === "skewX")
      str_idx += nsvg__parseSkewX(t, str.substr(str_idx));
    else if (str.substr(str_idx, 5) === "skewY")
      str_idx += nsvg__parseSkewY(t, str.substr(str_idx));
    else {
      ++str_idx;
      continue;
    }

    nsvg__xformPremultiply(xform, t);
  }
}

function nsvg__parseUrl(/* const char */ str) {
  var id = "";
  var str_idx = 4;
  if (str[str_idx] === '#')
    str_idx++;

  while (str_idx < str.length && str[str_idx] !== ')') {
    id += str[str_idx++];
  }

  return id;
}

/* static */ /* char */ function nsvg__parseLineCap(/* const char */ str) {
  if (str === "butt")
    return 0 /* NSVG_CAP_BUTT */;
  else if (str === "round")
    return 1 /* NSVG_CAP_ROUND */;
  else if (str === "square")
    return 2 /* NSVG_CAP_SQUARE */;

  return 0 /* NSVG_CAP_BUTT */;
}

/* static */ /* char */ function nsvg__parseLineJoin(/* const char */ str) {
  if (str === "miter")
    return 0 /* NSVG_JOIN_MITER */;
  else if (str === "round")
    return 1 /* NSVG_JOIN_ROUND */;
  else if (str === "bevel")
    return 2 /* NSVG_JOIN_BEVEL */;

  return 0 /* NSVG_CAP_BUTT */;
}

/* static */ /* char */ function nsvg__parseFillRule(/* const char */ str) {
  if (str === "nonzero")
    return 0 /* NSVG_FILLRULE_NONZERO */;
  else if (str === "evenodd")
    return 1 /* NSVG_FILLRULE_EVENODD */;

  return 0 /* NSVG_FILLRULE_NONZERO */;
}

/* static */ /* const char */ function nsvg__getNextDashItem(/* const char */ s) {
  var it = "";
  var s_idx = 0;
  while ((s[s_idx]) && (nsvg__isspace(s[s_idx]) || ((s[s_idx]) === ',')))
    s_idx++;

  while ((s[s_idx]) && ((!nsvg__isspace(s[s_idx])) && ((s[s_idx]) != ','))) {
    it += s[s_idx];

    s_idx++;
  }

  return {s_idx: s_idx, it: it};
}

/* static */ /* int */ function nsvg__parseStrokeDashArray(
    /* NSVGparser */ p, /* const char */ str, /* float */ strokeDashArray) {
  var /* char */ item;
  var /* int */ count = 0;
  var /* int */ i;
  var /* float */ sum = 0.0;
  var str_idx = 0;
  if (str[0] === 'n')
    return 0;

  while (str[str_idx]) {
    var res = nsvg__getNextDashItem(str.substr(str_idx));
    str_idx += res.s_idx;
    item = res.it;
    if (!item) break;

    if (count < 8)
      strokeDashArray[count++] =
          fabsf(nsvg__parseCoordinate(p, item, 0.0, nsvg__actualLength(p)));
  }

  for (i = 0; i < count; i++)
    sum += strokeDashArray[i];

  if (sum <= 1e-6)
    count = 0;

  return count;
}

/* static */ /* int */ function nsvg__parseAttr(
    /* NSVGparser */ p, /* const char */ name, /* const char */ value) {
  var /* float */ xform = new Float32Array(6);
  var /* NSVGattrib */ attr = nsvg__getAttr(p);
  if (!attr)
    return 0;

  if (name === "style") {
    nsvg__parseStyle(p, value);
  } else if (name === "display") {
    if (value === "none")
      attr.visible = 0;

  } else if (name === "fill") {
    if (value === "none") {
      attr.hasFill = 0;
    } else if (value.substr(0, 4) === "url(") {
      attr.hasFill = 2;
      attr.fillGradient = nsvg__parseUrl(value);
    } else {
      attr.hasFill = 1;
      attr.fillColor = nsvg__parseColor(value);
    }

  } else if (name === "opacity") {
    attr.opacity = nsvg__parseOpacity(value);
  } else if (name === "fill-opacity") {
    attr.fillOpacity = nsvg__parseOpacity(value);
  } else if (name === "stroke") {
    if (value === "none") {
      attr.hasStroke = 0;
    } else if (value.substr(0, 4) === "url(") {
      attr.hasStroke = 2;
      attr.strokeGradient = nsvg__parseUrl(value);
    } else {
      attr.hasStroke = 1;
      attr.strokeColor = nsvg__parseColor(value);
    }

  } else if (name === "stroke-width") {
    attr.strokeWidth =
        nsvg__parseCoordinate(p, value, 0.0, nsvg__actualLength(p));
  } else if (name === "stroke-dasharray") {
    attr.strokeDashCount =
        nsvg__parseStrokeDashArray(p, value, attr.strokeDashArray);
  } else if (name === "stroke-dashoffset") {
    attr.strokeDashOffset =
        nsvg__parseCoordinate(p, value, 0.0, nsvg__actualLength(p));
  } else if (name === "stroke-opacity") {
    attr.strokeOpacity = nsvg__parseOpacity(value);
  } else if (name === "stroke-linecap") {
    attr.strokeLineCap = nsvg__parseLineCap(value);
  } else if (name === "stroke-linejoin") {
    attr.strokeLineJoin = nsvg__parseLineJoin(value);
  } else if (name === "fill-rule") {
    attr.fillRule = nsvg__parseFillRule(value);
  } else if (name === "font-size") {
    attr.fontSize = nsvg__parseCoordinate(p, value, 0.0, nsvg__actualLength(p));
  } else if (name === "transform") {
    nsvg__parseTransform(xform, value);
    nsvg__xformPremultiply(attr.xform, xform);
  } else if (name === "stop-color") {
    attr.stopColor = nsvg__parseColor(value);
  } else if (name === "stop-opacity") {
    attr.stopOpacity = nsvg__parseOpacity(value);
  } else if (name === "offset") {
    attr.stopOffset = nsvg__parseCoordinate(p, value, 0.0, 1.0);
  } else if (name === "id") {
    attr.id = value;
  } else if (name === "class") {
    attr.class = value;
    if (p.styles[value]) {
      nsvg__parseStyle(p, p.styles[value]);
    } else {
      console.log('No matching style for class: ' + value);
    }
  } else {
    return 0;
  }

  return 1;
}

/* static */ /* int */ function nsvg__parseNameValue(/* NSVGparser */ p, str) {
  var /* const char */ str;
  var /* const char */ val;
  var /* int */ n;
  var name = "", value = "";

  var str_idx = 0, start = 0;
  var end = str.length;
  while ((str_idx < end) && ((str[str_idx]) != ':'))
    ++str_idx;

  val = str_idx;
  while ((str_idx > start) && (((str[str_idx]) === ':') ||
  nsvg__isspace(str[str_idx])))
    --str_idx;

  ++str_idx;
  n = str_idx - start;

  if (n) name = str.substr(start, start + n);

  while (val < end && (str[val] === ':' || nsvg__isspace(str[val])))
    ++val;

  n = end - val;

  if (n) value = str.substr(val, n);

  return nsvg__parseAttr(p, name, value);
}

/* static */ /* void */ function nsvg__parseStyle(/* NSVGparser */ p,
                                                  /* const char */ str) {
  var str_idx = 0;
  var /* const char */ start;
  var /* const char */ end;
  while (str[str_idx]) {
    while ((str[str_idx]) && nsvg__isspace(str[str_idx]))
      ++str_idx;

    start = str_idx;
    while ((str[str_idx]) && ((str[str_idx]) != ';'))
      ++str_idx;

    end = str_idx;
    while (end > start && ((str[end] === ';') || nsvg__isspace(str[end])))
      --end;

    ++end;
    nsvg__parseNameValue(p, str.substr(start, end - start));
    if (str[str_idx])
      ++str_idx;
  }
}

/* static */ /* void */ function nsvg__parseAttribs(/* NSVGparser */ p,
                                                    /* const char */ attr) {
  var /* int */ i;
  for (i = 0; attr[i]; i += 2) {
    if (attr[i] === "style")
      nsvg__parseStyle(p, attr[i + 1]);
    else
      nsvg__parseAttr(p, attr[i], attr[i + 1]);
  }
}

/* static */ /* int */ function nsvg__getArgsPerElement(/* char */ cmd) {
  switch (cmd) {
  case 'v':
  case 'V':
  case 'h':
  case 'H':
    return 1;
  case 'm':
  case 'M':
  case 'l':
  case 'L':
  case 't':
  case 'T':
    return 2;
  case 'q':
  case 'Q':
  case 's':
  case 'S':
    return 4;
  case 'c':
  case 'C':
    return 6;
  case 'a':
  case 'A':
    return 7;
  }

  return 0;
}

/* static */ /* void */ function nsvg__pathMoveTo(
    /* NSVGparser */ p, /* float */ cpx, /* float */ cpy, /* float */ args,
    /* int */ rel) {
  if (rel) {
    cpx += args[0];
    cpy += args[1];
  } else {
    cpx = args[0];
    cpy = args[1];
  }

  nsvg__moveTo(p, cpx, cpy);
  return {cpx : cpx, cpy : cpy};
}

/* static */ /* void */ function nsvg__pathLineTo(
    /* NSVGparser */ p, /* float */ cpx, /* float */ cpy, /* float */ args,
    /* int */ rel) {
  if (rel) {
    cpx += args[0];
    cpy += args[1];
  } else {
    cpx = args[0];
    cpy = args[1];
  }

  nsvg__lineTo(p, cpx, cpy);
  return {cpx : cpx, cpy : cpy};
}

/* static */ /* void */ function nsvg__pathHLineTo(
    /* NSVGparser */ p, /* float */ cpx, /* float */ cpy, /* float */ args,
    /* int */ rel) {
  if (rel)
    cpx += args[0];
  else
    cpx = args[0];

  nsvg__lineTo(p, cpx, cpy);
  return {cpx : cpx, cpy : cpy};
}

/* static */ /* void */ function nsvg__pathVLineTo(
    /* NSVGparser */ p, /* float */ cpx, /* float */ cpy, /* float */ args,
    /* int */ rel) {
  if (rel)
    cpy += args[0];
  else
    cpy = args[0];

  nsvg__lineTo(p, cpx, cpy);
  return {cpx : cpx, cpy : cpy};
}

/* static */ /* void */ function nsvg__pathCubicBezTo(
    /* NSVGparser */ p, /* float */ cpx, /* float */ cpy, /* float */ cpx2,
    /* float */ cpy2, /* float */ args, /* int */ rel) {
  var /* float */ x2;
  var /* float */ y2;
  var /* float */ cx1;
  var /* float */ cy1;
  var /* float */ cx2;
  var /* float */ cy2;
  if (rel) {
    cx1 = cpx + args[0];
    cy1 = cpy + args[1];
    cx2 = cpx + args[2];
    cy2 = cpy + args[3];
    x2 = cpx + args[4];
    y2 = cpy + args[5];
  } else {
    cx1 = args[0];
    cy1 = args[1];
    cx2 = args[2];
    cy2 = args[3];
    x2 = args[4];
    y2 = args[5];
  }

  nsvg__cubicBezTo(p, cx1, cy1, cx2, cy2, x2, y2);
  return {cpx2 : cx2, cpy2 : cy2, cpx : x2, cpy : y2};
}

/* static */ /* void */ function nsvg__pathCubicBezShortTo(
    /* NSVGparser */ p, /* float */ cpx, /* float */ cpy, /* float */ cpx2,
    /* float */ cpy2, /* float */ args, /* int */ rel) {
  var /* float */ x1;
  var /* float */ y1;
  var /* float */ x2;
  var /* float */ y2;
  var /* float */ cx1;
  var /* float */ cy1;
  var /* float */ cx2;
  var /* float */ cy2;
  x1 = cpx;
  y1 = cpy;
  if (rel) {
    cx2 = cpx + args[0];
    cy2 = cpy + args[1];
    x2 = cpx + args[2];
    y2 = cpy + args[3];
  } else {
    cx2 = args[0];
    cy2 = args[1];
    x2 = args[2];
    y2 = args[3];
  }

  cx1 = (2 * x1) - cpx2;
  cy1 = (2 * y1) - cpy2;
  nsvg__cubicBezTo(p, cx1, cy1, cx2, cy2, x2, y2);
  return {cpx2 : cx2, cpy2 : cy2, cpx : x2, cpy : y2};
}

/* static */ /* void */ function nsvg__pathQuadBezTo(
    /* NSVGparser */ p, /* float */ cpx, /* float */ cpy, /* float */ cpx2,
    /* float */ cpy2, /* float */ args, /* int */ rel) {
  var /* float */ x1;
  var /* float */ y1;
  var /* float */ x2;
  var /* float */ y2;
  var /* float */ cx;
  var /* float */ cy;
  var /* float */ cx1;
  var /* float */ cy1;
  var /* float */ cx2;
  var /* float */ cy2;
  x1 = cpx;
  y1 = cpy;
  if (rel) {
    cx = cpx + args[0];
    cy = cpy + args[1];
    x2 = cpx + args[2];
    y2 = cpy + args[3];
  } else {
    cx = args[0];
    cy = args[1];
    x2 = args[2];
    y2 = args[3];
  }

  cx1 = x1 + ((2.0 / 3.0) * (cx - x1));
  cy1 = y1 + ((2.0 / 3.0) * (cy - y1));
  cx2 = x2 + ((2.0 / 3.0) * (cx - x2));
  cy2 = y2 + ((2.0 / 3.0) * (cy - y2));
  nsvg__cubicBezTo(p, cx1, cy1, cx2, cy2, x2, y2);
  return {cpx2 : cx, cpy2 : cy, cpx : x2, cpy : y2};
}

/* static */ /* void */ function nsvg__pathQuadBezShortTo(
    /* NSVGparser */ p, /* float */ cpx, /* float */ cpy, /* float */ cpx2,
    /* float */ cpy2, /* float */ args, /* int */ rel) {
  var /* float */ x1;
  var /* float */ y1;
  var /* float */ x2;
  var /* float */ y2;
  var /* float */ cx;
  var /* float */ cy;
  var /* float */ cx1;
  var /* float */ cy1;
  var /* float */ cx2;
  var /* float */ cy2;
  x1 = cpx;
  y1 = cpy;
  if (rel) {
    x2 = cpx + args[0];
    y2 = cpy + args[1];
  } else {
    x2 = args[0];
    y2 = args[1];
  }

  cx = (2 * x1) - cpx2;
  cy = (2 * y1) - cpy2;
  cx1 = x1 + ((2.0 / 3.0) * (cx - x1));
  cy1 = y1 + ((2.0 / 3.0) * (cy - y1));
  cx2 = x2 + ((2.0 / 3.0) * (cx - x2));
  cy2 = y2 + ((2.0 / 3.0) * (cy - y2));
  nsvg__cubicBezTo(p, cx1, cy1, cx2, cy2, x2, y2);
  return {cpx2 : cx, cpy2 : cy, cpx : x2, cpy : y2};
}

/* static */ /* float */ function nsvg__sqr(/* float */ x) { return x * x; }

/* static */ /* float */ function nsvg__vmag(/* float */ x, /* float */ y) {
  return sqrtf((x * x) + (y * y));
}

/* static */ /* float */ function nsvg__vecrat(/* float */ ux, /* float */ uy,
                                               /* float */ vx, /* float */ vy) {
  return ((ux * vx) + (uy * vy)) / (nsvg__vmag(ux, uy) * nsvg__vmag(vx, vy));
}

/* static */ /* float */ function nsvg__vecang(/* float */ ux, /* float */ uy,
                                               /* float */ vx, /* float */ vy) {
  var /* float */ r = nsvg__vecrat(ux, uy, vx, vy);
  if (r < (-1.0))
    r = -1.0;

  if (r > 1.0)
    r = 1.0;

  return ((ux * vy) < (uy * vx) ? -1.0 : 1.0) * acosf(r);
}

/* static */ /* void */ function nsvg__pathArcTo(
    /* NSVGparser */ p, /* float */ cpx, /* float */ cpy, /* float */ args,
    /* int */ rel) {
  var /* float */ rx;
  var /* float */ ry;
  var /* float */ rotx;
  var /* float */ x1;
  var /* float */ y1;
  var /* float */ x2;
  var /* float */ y2;
  var /* float */ cx;
  var /* float */ cy;
  var /* float */ dx;
  var /* float */ dy;
  var /* float */ d;
  var /* float */ x1p;
  var /* float */ y1p;
  var /* float */ cxp;
  var /* float */ cyp;
  var /* float */ s;
  var /* float */ sa;
  var /* float */ sb;
  var /* float */ ux;
  var /* float */ uy;
  var /* float */ vx;
  var /* float */ vy;
  var /* float */ a1;
  var /* float */ da;
  var /* float */ x;
  var /* float */ y;
  var /* float */ tanx;
  var /* float */ tany;
  var /* float */ a;
  var /* float */ px = 0;
  var /* float */ py = 0;
  var /* float */ ptanx = 0;
  var /* float */ ptany = 0;
  var /* float */ t = new Float32Array(6);
  var /* float */ sinrx;
  var /* float */ cosrx;
  var /* int */ fa;
  var /* int */ fs;
  var /* int */ i;
  var /* int */ ndivs;
  var /* float */ hda;
  var /* float */ kappa;

  rx = fabsf(args[0]);
  ry = fabsf(args[1]);
  rotx = (args[2] / 180.0) * 3.14159265358979323846264338327;
  fa = fabsf(args[3]) > 1e-6 ? 1 : 0;
  fs = fabsf(args[4]) > 1e-6 ? 1 : 0;
  x1 = cpx;
  y1 = cpy;
  if (rel) {
    x2 = cpx + args[5];
    y2 = cpy + args[6];
  } else {
    x2 = args[5];
    y2 = args[6];
  }

  dx = x1 - x2;
  dy = y1 - y2;
  d = sqrtf((dx * dx) + (dy * dy));
  if (((d < 1e-6) || (rx < 1e-6)) || (ry < 1e-6)) {
    nsvg__lineTo(p, x2, y2);
    return {cpx : x2, cpy : y2};
  }

  sinrx = sinf(rotx);
  cosrx = cosf(rotx);
  x1p = ((cosrx * dx) / 2.0) + ((sinrx * dy) / 2.0);
  y1p = (((-sinrx) * dx) / 2.0) + ((cosrx * dy) / 2.0);
  d = (nsvg__sqr(x1p) / nsvg__sqr(rx)) + (nsvg__sqr(y1p) / nsvg__sqr(ry));
  if (d > 1) {
    d = sqrtf(d);
    rx *= d;
    ry *= d;
  }

  s = 0.0;
  sa = ((nsvg__sqr(rx) * nsvg__sqr(ry)) - (nsvg__sqr(rx) * nsvg__sqr(y1p))) -
       (nsvg__sqr(ry) * nsvg__sqr(x1p));
  sb = (nsvg__sqr(rx) * nsvg__sqr(y1p)) + (nsvg__sqr(ry) * nsvg__sqr(x1p));
  if (sa < 0.0)
    sa = 0.0;

  if (sb > 0.0)
    s = sqrtf(sa / sb);

  if (fa === fs)
    s = -s;

  cxp = ((s * rx) * y1p) / ry;
  cyp = ((s * (-ry)) * x1p) / rx;
  cx = (((x1 + x2) / 2.0) + (cosrx * cxp)) - (sinrx * cyp);
  cy = (((y1 + y2) / 2.0) + (sinrx * cxp)) + (cosrx * cyp);
  ux = (x1p - cxp) / rx;
  uy = (y1p - cyp) / ry;
  vx = ((-x1p) - cxp) / rx;
  vy = ((-y1p) - cyp) / ry;
  a1 = nsvg__vecang(1.0, 0.0, ux, uy);
  da = nsvg__vecang(ux, uy, vx, vy);
  if (fa) {
    if (da > 0.0)
      da = da - (2 * 3.14159265358979323846264338327);
    else
      da = (2 * 3.14159265358979323846264338327) + da;
  }

  t[0] = cosrx;
  t[1] = sinrx;
  t[2] = -sinrx;
  t[3] = cosrx;
  t[4] = cx;
  t[5] = cy;
  ndivs = ((fabsf(da) / (3.14159265358979323846264338327 * 0.5)) + 1.0);
  hda = (da / (ndivs)) / 2.0;
  kappa = fabsf(((4.0 / 3.0) * (1.0 - cosf(hda))) / sinf(hda));
  if (da < 0.0)
    kappa = -kappa;

  for (i = 0; i <= ndivs; i++) {
    a = a1 + (da * (i / (ndivs)));
    dx = cosf(a);
    dy = sinf(a);
    //nsvg__xformPoint(&x, &y, dx * rx, dy * ry, t);
    x = dx * rx * t[0] + dy * ry * t[2] + t[4];
    y = dx * rx * t[1] + dy * ry * t[3] + t[5];
    //nsvg__xformVec(&tanx, &tany, ((-dy) * rx) * kappa, (dx * ry) * kappa, t);
    tanx = -dy * rx * kappa * t[0] + dx * ry * kappa * t[2];
    tany = -dy * rx * kappa * t[1] + dx * ry * kappa * t[3];
    if (i > 0)
      nsvg__cubicBezTo(p, px + ptanx, py + ptany, x - tanx, y - tany, x, y);

    px = x;
    py = y;
    ptanx = tanx;
    ptany = tany;
  }

  return {cpx : x2, cpy : y2};
}

/* static */ /* void */ function nsvg__parsePath(/* NSVGparser */ p,
                                                 /* const char */ attr) {
  var /* const char */ s = 0;
  var /* char */ cmd = '\0';
  var /* float */ args = new Float32Array(10);
  var /* int */ nargs;
  var /* int */ rargs = 0;
  var /* float */ cpx;
  var /* float */ cpy;
  var /* float */ cpx2;
  var /* float */ cpy2;
  var /* const char */ tmp = Array(4);
  var /* char */ closedFlag;
  var /* int */ i;
  var /* char */ item;
  for (i = 0; attr[i]; i += 2) {
    if (attr[i] === "d") {
      s = attr[i + 1];
    } else {
      tmp[0] = attr[i];
      tmp[1] = attr[i + 1];
      tmp[2] = 0;
      tmp[3] = 0;
      nsvg__parseAttribs(p, tmp);
    }
  }

  var s_idx = 0;

  if (s) {
    nsvg__resetPath(p);
    cpx = 0;
    cpy = 0;
    cpx2 = 0;
    cpy2 = 0;
    closedFlag = 0;
    nargs = 0;
    while (s[s_idx]) {
      var res = nsvg__getNextPathItem(s.substr(s_idx));
      s_idx += res.s_idx;
      item = res.it;
      if (!item.length)
        break;

      if (nsvg__isnum(item[0])) {
        if (nargs < 10)
          args[nargs++] = atof(item);

        if (nargs >= rargs) {
          switch (cmd) {
          case 'm':
          case 'M':
            var res = nsvg__pathMoveTo(p, cpx, cpy, args, cmd === 'm' ? 1 : 0);
            cpx = res.cpx; cpy = res.cpy;
            cmd = cmd === 'm' ? 'l' : 'L';
            rargs = nsvg__getArgsPerElement(cmd);
            cpx2 = cpx; cpy2 = cpy;
            break;

          case 'l':
          case 'L':
            var res = nsvg__pathLineTo(p, cpx, cpy, args, cmd === 'l' ? 1 : 0);
            cpx = res.cpx; cpy = res.cpy;
            cpx2 = cpx; cpy2 = cpy;
            break;

          case 'H':
          case 'h':
            var res = nsvg__pathHLineTo(p, cpx, cpy, args, cmd === 'h' ? 1 : 0);
            cpx = res.cpx; cpy = res.cpy;
            cpx2 = cpx; cpy2 = cpy;
            break;

          case 'V':
          case 'v':
            var res = nsvg__pathVLineTo(p, cpx, cpy, args, cmd === 'v' ? 1 : 0);
            cpx = res.cpx; cpy = res.cpy;
            cpx2 = cpx; cpy2 = cpy;
            break;

          case 'C':
          case 'c':
            var res = nsvg__pathCubicBezTo(p, cpx, cpy, cpx2, cpy2, args,
                                           cmd === 'c' ? 1 : 0);
            cpx = res.cpx; cpy = res.cpy; cpx2 = res.cpx2; cpy2 = res.cpy2;
            break;

          case 'S':
          case 's':
            var res = nsvg__pathCubicBezShortTo(p, cpx, cpy, cpx2, cpy2, args,
                                                cmd === 's' ? 1 : 0);
            cpx = res.cpx; cpy = res.cpy; cpx2 = res.cpx2; cpy2 = res.cpy2;
            break;

          case 'Q':
          case 'q':
            var res = nsvg__pathQuadBezTo(p, cpx, cpy, cpx2, cpy2, args,
                                          cmd === 'q' ? 1 : 0);
            cpx = res.cpx; cpy = res.cpy; cpx2 = res.cpx2; cpy2 = res.cpy2;
            break;

          case 'T':
          case 't':
            var res = nsvg__pathQuadBezShortTo(p, cpx, cpy, cpx2, cpy2, args,
                                               cmd === 't' ? 1 : 0);
            cpx = res.cpx; cpy = res.cpy; cpx2 = res.cpx2; cpy2 = res.cpy2;
            break;

          case 'A':
          case 'a':
            var res = nsvg__pathArcTo(p, cpx, cpy, args, cmd === 'a' ? 1 : 0);
            cpx = res.cpx; cpy = res.cpy;
            cpx2 = cpx; cpy2 = cpy;
            break;

          default:
            if (nargs >= 2) {
              cpx = args[nargs - 2];
              cpy = args[nargs - 1];
              cpx2 = cpx;
              cpy2 = cpy;
            }

            break;
          }

          nargs = 0;
        }

      } else {
        cmd = item[0];
        rargs = nsvg__getArgsPerElement(cmd);
        if ((cmd === 'M') || (cmd === 'm')) {
          if (p.npts > 0)
            nsvg__addPath(p, closedFlag);

          nsvg__resetPath(p);
          closedFlag = 0;
          nargs = 0;
        } else if ((cmd === 'Z') || (cmd === 'z')) {
          closedFlag = 1;
          if (p.npts > 0) {
            cpx = p.pts[0];
            cpy = p.pts[1];
            cpx2 = cpx;
            cpy2 = cpy;
            nsvg__addPath(p, closedFlag);
          }

          nsvg__resetPath(p);
          nsvg__moveTo(p, cpx, cpy);
          closedFlag = 0;
          nargs = 0;
        }
      }
    }

    if (p.npts)
      nsvg__addPath(p, closedFlag);
  }

  nsvg__addShape(p);
}

/* static */ /* void */ function nsvg__parseRect(/* NSVGparser */ p,
                                                 /* const char */ attr) {
  var /* float */ x = 0.0;
  var /* float */ y = 0.0;
  var /* float */ w = 0.0;
  var /* float */ h = 0.0;
  var /* float */ rx = -1.0;
  var /* float */ ry = -1.0;
  var /* int */ i;
  for (i = 0; attr[i]; i += 2) {
    if (!nsvg__parseAttr(p, attr[i], attr[i + 1])) {
      if (attr[i] === "x")
        x = nsvg__parseCoordinate(p, attr[i + 1], nsvg__actualOrigX(p),
                                  nsvg__actualWidth(p));

      if (attr[i] === "y")
        y = nsvg__parseCoordinate(p, attr[i + 1], nsvg__actualOrigY(p),
                                  nsvg__actualHeight(p));

      if (attr[i] === "width")
        w = nsvg__parseCoordinate(p, attr[i + 1], 0.0, nsvg__actualWidth(p));

      if (attr[i] === "height")
        h = nsvg__parseCoordinate(p, attr[i + 1], 0.0, nsvg__actualHeight(p));

      if (attr[i] === "rx")
        rx = fabsf(
            nsvg__parseCoordinate(p, attr[i + 1], 0.0, nsvg__actualWidth(p)));

      if (attr[i] === "ry")
        ry = fabsf(
            nsvg__parseCoordinate(p, attr[i + 1], 0.0, nsvg__actualHeight(p)));
    }
  }

  if ((rx < 0.0) && (ry > 0.0))
    rx = ry;

  if ((ry < 0.0) && (rx > 0.0))
    ry = rx;

  if (rx < 0.0)
    rx = 0.0;

  if (ry < 0.0)
    ry = 0.0;

  if (rx > (w / 2.0))
    rx = w / 2.0;

  if (ry > (h / 2.0))
    ry = h / 2.0;

  if ((w != 0.0) && (h != 0.0)) {
    nsvg__resetPath(p);
    if ((rx < 0.00001) || (ry < 0.0001)) {
      nsvg__moveTo(p, x, y);
      nsvg__lineTo(p, x + w, y);
      nsvg__lineTo(p, x + w, y + h);
      nsvg__lineTo(p, x, y + h);
    } else {
      nsvg__moveTo(p, x + rx, y);
      nsvg__lineTo(p, (x + w) - rx, y);
      nsvg__cubicBezTo(p, (x + w) - (rx * (1 - 0.5522847493)), y, x + w,
                       y + (ry * (1 - 0.5522847493)), x + w, y + ry);
      nsvg__lineTo(p, x + w, (y + h) - ry);
      nsvg__cubicBezTo(p, x + w, (y + h) - (ry * (1 - 0.5522847493)),
                       (x + w) - (rx * (1 - 0.5522847493)), y + h, (x + w) - rx,
                       y + h);
      nsvg__lineTo(p, x + rx, y + h);
      nsvg__cubicBezTo(p, x + (rx * (1 - 0.5522847493)), y + h, x,
                       (y + h) - (ry * (1 - 0.5522847493)), x, (y + h) - ry);
      nsvg__lineTo(p, x, y + ry);
      nsvg__cubicBezTo(p, x, y + (ry * (1 - 0.5522847493)),
                       x + (rx * (1 - 0.5522847493)), y, x + rx, y);
    }

    nsvg__addPath(p, 1);
    nsvg__addShape(p);
  }
}

/* static */ /* void */ function nsvg__parseCircle(/* NSVGparser */ p,
                                                   /* const char */ attr) {
  var /* float */ cx = 0.0;
  var /* float */ cy = 0.0;
  var /* float */ r = 0.0;
  var /* int */ i;
  for (i = 0; attr[i]; i += 2) {
    if (!nsvg__parseAttr(p, attr[i], attr[i + 1])) {
      if (attr[i] === "cx")
        cx = nsvg__parseCoordinate(p, attr[i + 1], nsvg__actualOrigX(p),
                                   nsvg__actualWidth(p));

      if (attr[i] === "cy")
        cy = nsvg__parseCoordinate(p, attr[i + 1], nsvg__actualOrigY(p),
                                   nsvg__actualHeight(p));

      if (attr[i] === "r")
        r = fabsf(
            nsvg__parseCoordinate(p, attr[i + 1], 0.0, nsvg__actualLength(p)));
    }
  }

  if (r > 0.0) {
    nsvg__resetPath(p);
    nsvg__moveTo(p, cx + r, cy);
    nsvg__cubicBezTo(p, cx + r, cy + (r * 0.5522847493),
                     cx + (r * 0.5522847493), cy + r, cx, cy + r);
    nsvg__cubicBezTo(p, cx - (r * 0.5522847493), cy + r, cx - r,
                     cy + (r * 0.5522847493), cx - r, cy);
    nsvg__cubicBezTo(p, cx - r, cy - (r * 0.5522847493),
                     cx - (r * 0.5522847493), cy - r, cx, cy - r);
    nsvg__cubicBezTo(p, cx + (r * 0.5522847493), cy - r, cx + r,
                     cy - (r * 0.5522847493), cx + r, cy);
    nsvg__addPath(p, 1);
    nsvg__addShape(p);
  }
}

/* static */ /* void */ function nsvg__parseEllipse(/* NSVGparser */ p,
                                                    /* const char */ attr) {
  var /* float */ cx = 0.0;
  var /* float */ cy = 0.0;
  var /* float */ rx = 0.0;
  var /* float */ ry = 0.0;
  var /* int */ i;
  for (i = 0; attr[i]; i += 2) {
    if (!nsvg__parseAttr(p, attr[i], attr[i + 1])) {
      if (attr[i] === "cx")
        cx = nsvg__parseCoordinate(p, attr[i + 1], nsvg__actualOrigX(p),
                                   nsvg__actualWidth(p));

      if (attr[i] === "cy")
        cy = nsvg__parseCoordinate(p, attr[i + 1], nsvg__actualOrigY(p),
                                   nsvg__actualHeight(p));

      if (attr[i] === "rx")
        rx = fabsf(
            nsvg__parseCoordinate(p, attr[i + 1], 0.0, nsvg__actualWidth(p)));

      if (attr[i] === "ry")
        ry = fabsf(
            nsvg__parseCoordinate(p, attr[i + 1], 0.0, nsvg__actualHeight(p)));
    }
  }

  if ((rx > 0.0) && (ry > 0.0)) {
    nsvg__resetPath(p);
    nsvg__moveTo(p, cx + rx, cy);
    nsvg__cubicBezTo(p, cx + rx, cy + (ry * 0.5522847493),
                     cx + (rx * 0.5522847493), cy + ry, cx, cy + ry);
    nsvg__cubicBezTo(p, cx - (rx * 0.5522847493), cy + ry, cx - rx,
                     cy + (ry * 0.5522847493), cx - rx, cy);
    nsvg__cubicBezTo(p, cx - rx, cy - (ry * 0.5522847493),
                     cx - (rx * 0.5522847493), cy - ry, cx, cy - ry);
    nsvg__cubicBezTo(p, cx + (rx * 0.5522847493), cy - ry, cx + rx,
                     cy - (ry * 0.5522847493), cx + rx, cy);
    nsvg__addPath(p, 1);
    nsvg__addShape(p);
  }
}

/* static */ /* void */ function nsvg__parseLine(/* NSVGparser */ p,
                                                 /* const char */ attr) {
  var /* float */ x1 = 0.0;
  var /* float */ y1 = 0.0;
  var /* float */ x2 = 0.0;
  var /* float */ y2 = 0.0;
  var /* int */ i;
  for (i = 0; attr[i]; i += 2) {
    if (!nsvg__parseAttr(p, attr[i], attr[i + 1])) {
      if (attr[i] === "x1")
        x1 = nsvg__parseCoordinate(p, attr[i + 1], nsvg__actualOrigX(p),
                                   nsvg__actualWidth(p));

      if (attr[i] === "y1")
        y1 = nsvg__parseCoordinate(p, attr[i + 1], nsvg__actualOrigY(p),
                                   nsvg__actualHeight(p));

      if (attr[i] === "x2")
        x2 = nsvg__parseCoordinate(p, attr[i + 1], nsvg__actualOrigX(p),
                                   nsvg__actualWidth(p));

      if (attr[i] === "y2")
        y2 = nsvg__parseCoordinate(p, attr[i + 1], nsvg__actualOrigY(p),
                                   nsvg__actualHeight(p));
    }
  }

  nsvg__resetPath(p);
  nsvg__moveTo(p, x1, y1);
  nsvg__lineTo(p, x2, y2);
  nsvg__addPath(p, 0);
  nsvg__addShape(p);
}

/* static */ /* void */ function nsvg__parsePoly(
    /* NSVGparser */ p, /* const char */ attr, /* int */ closeFlag) {
  var /* int */ i;
  var /* const char */ s;
  var /* float */ args = new Float32Array(2);
  var /* int */ nargs;
  var /* int */ npts = 0;
  var /* char */ item;
  var s_idx = 0;
  nsvg__resetPath(p);
  for (i = 0; attr[i]; i += 2) {
    if (!nsvg__parseAttr(p, attr[i], attr[i + 1])) {
      if (attr[i] === "points") {
        s = attr[i + 1];
        nargs = 0;
        while (s[s_idx]) {
          var res = nsvg__getNextPathItem(s.substr(s_idx));
          s_idx += res.s_idx;
          item = res.it;
          args[nargs++] = atof(item);
          if (nargs >= 2) {
            if (npts === 0)
              nsvg__moveTo(p, args[0], args[1]);
            else
              nsvg__lineTo(p, args[0], args[1]);

            nargs = 0;
            npts++;
          }
        }
      }
    }
  }

  nsvg__addPath(p, closeFlag);
  nsvg__addShape(p);
}

/* static */ /* void */ function nsvg__parseSVG(/* NSVGparser */ p,
                                                /* const char */ attr) {
  var /* int */ i;
  for (i = 0; attr[i]; i += 2) {
    if (!nsvg__parseAttr(p, attr[i], attr[i + 1])) {
      if (attr[i] === "width") {
        p.image.width = nsvg__parseCoordinate(p, attr[i + 1], 0.0, 1.0);
      } else if (attr[i] === "height") {
        p.image.height = nsvg__parseCoordinate(p, attr[i + 1], 0.0, 1.0);
      } else if (attr[i] === "viewBox") {
        // sscanf(attr[i + 1], "%f%*[%%, \t]%f%*[%%, \t]%f%*[%%, \t]%f",
        // &p.viewMinx, &p.viewMiny, &p.viewWidth, &p.viewHeight);
      } else if (attr[i] === "preserveAspectRatio") {
        if (strstr(attr[i + 1], "none") != 0) {
          p.alignType = 0;
        } else {
          if (strstr(attr[i + 1], "xMin") != 0)
            p.alignX = 0;
          else if (strstr(attr[i + 1], "xMid") != 0)
            p.alignX = 1;
          else if (strstr(attr[i + 1], "xMax") != 0)
            p.alignX = 2;

          if (strstr(attr[i + 1], "yMin") != 0)
            p.alignY = 0;
          else if (strstr(attr[i + 1], "yMid") != 0)
            p.alignY = 1;
          else if (strstr(attr[i + 1], "yMax") != 0)
            p.alignY = 2;

          p.alignType = 1;
          if (strstr(attr[i + 1], "slice") != 0)
            p.alignType = 2;
        }
      }
    }
  }
}

/* static */ /* void */ function nsvg__parseGradient(
    /* NSVGparser */ p, /* const char */ attr, /* char */ type) {
  var /* int */ i;
  var /* NSVGgradientData */ grad = new NSVGgradientData();
  grad.units = 1 /* NSVG_OBJECT_SPACE */;
  grad.type = type;
  if (grad.type === 2 /* NSVG_PAINT_LINEAR_GRADIENT */) {
    grad.linear.x1 = nsvg__coord(0.0, 7 /* NSVG_UNITS_PERCENT */);
    grad.linear.y1 = nsvg__coord(0.0, 7 /* NSVG_UNITS_PERCENT */);
    grad.linear.x2 = nsvg__coord(100.0, 7 /* NSVG_UNITS_PERCENT */);
    grad.linear.y2 = nsvg__coord(0.0, 7 /* NSVG_UNITS_PERCENT */);
  } else if (grad.type === 3 /* NSVG_PAINT_RADIAL_GRADIENT */) {
    grad.radial.cx = nsvg__coord(50.0, 7 /* NSVG_UNITS_PERCENT */);
    grad.radial.cy = nsvg__coord(50.0, 7 /* NSVG_UNITS_PERCENT */);
    grad.radial.r = nsvg__coord(50.0, 7 /* NSVG_UNITS_PERCENT */);
  }

  nsvg__xformIdentity(grad.xform);
  for (i = 0; attr[i]; i += 2) {
    if (attr[i] === "id") {
      // strncpy(grad.id, attr[i + 1], 63);
      grad.id = attr[i + 1];
    } else if (!nsvg__parseAttr(p, attr[i], attr[i + 1])) {
      if (attr[i] === "gradientUnits") {
        if (attr[i + 1] === "objectBoundingBox")
          grad.units = 1 /* NSVG_OBJECT_SPACE */;
        else
          grad.units = 0 /* NSVG_USER_SPACE */;

      } else if (attr[i] === "gradientTransform") {
        nsvg__parseTransform(grad.xform, attr[i + 1]);
      } else if (attr[i] === "cx") {
        grad.radial.cx = nsvg__parseCoordinateRaw(attr[i + 1]);
      } else if (attr[i] === "cy") {
        grad.radial.cy = nsvg__parseCoordinateRaw(attr[i + 1]);
      } else if (attr[i] === "r") {
        grad.radial.r = nsvg__parseCoordinateRaw(attr[i + 1]);
      } else if (attr[i] === "fx") {
        grad.radial.fx = nsvg__parseCoordinateRaw(attr[i + 1]);
      } else if (attr[i] === "fy") {
        grad.radial.fy = nsvg__parseCoordinateRaw(attr[i + 1]);
      } else if (attr[i] === "x1") {
        grad.linear.x1 = nsvg__parseCoordinateRaw(attr[i + 1]);
      } else if (attr[i] === "y1") {
        grad.linear.y1 = nsvg__parseCoordinateRaw(attr[i + 1]);
      } else if (attr[i] === "x2") {
        grad.linear.x2 = nsvg__parseCoordinateRaw(attr[i + 1]);
      } else if (attr[i] === "y2") {
        grad.linear.y2 = nsvg__parseCoordinateRaw(attr[i + 1]);
      } else if (attr[i] === "spreadMethod") {
        if (attr[i + 1] === "pad")
          grad.spread = 0 /* NSVG_SPREAD_PAD */;
        else if (attr[i + 1] === "reflect")
          grad.spread = 1 /* NSVG_SPREAD_REFLECT */;
        else if (attr[i + 1] === "repeat")
          grad.spread = 2 /* NSVG_SPREAD_REPEAT */;

      } else if (attr[i] === "xlink:href") {
        var /* const char */ href = attr[i + 1];
        // strncpy(grad.ref, href + 1, 62);
        grad.ref[62] = '\0';
      }
    }
  }

  grad.next = p.gradients;
  p.gradients = grad;
}

/* static */ /* void */ function nsvg__parseGradientStop(
    /* NSVGparser */ p, /* const char */ attr) {
  var /* NSVGattrib */ curAttr = nsvg__getAttr(p);
  var /* NSVGgradientData */ grad;
  var /* NSVGgradientStop */ stop;
  var /* int */ i;
  var /* int */ idx;
  curAttr.stopOffset = 0;
  curAttr.stopColor = 0;
  curAttr.stopOpacity = 1.0;
  for (i = 0; attr[i]; i += 2) {
    nsvg__parseAttr(p, attr[i], attr[i + 1]);
  }

  grad = p.gradients;
  if (grad === 0)
    return;

  grad.nstops++;
  // realloc().
  if (grad.stops === null)
    grad.stops = [];
  while (grad.stops.length > grad.nstops)
    grad.stops.pop();
  while (grad.stops.length < grad.nstops)
    grad.stops.push(new NSVGgradientStop());

  idx = grad.nstops - 1;
  for (i = 0; i < (grad.nstops - 1); i++) {
    if (curAttr.stopOffset < grad.stops[i].offset) {
      idx = i;
      break;
    }
  }

  if (idx != (grad.nstops - 1)) {
    for (i = grad.nstops - 1; i > idx; i--)
      grad.stops[i] = grad.stops[i - 1];
  }

  stop = grad.stops[idx];
  stop.color = orsl24(curAttr.stopColor, curAttr.stopOpacity * 255);
  stop.offset = curAttr.stopOffset;
}

/* static */ /* void */ function nsvg__startElement(
    /* void */ ud, /* const char */ el, /* const char */ attr) {
  var /* NSVGparser */ p = ud;
  if (p.defsFlag) {
    if (el === "linearGradient") {
      nsvg__parseGradient(p, attr, 2 /* NSVG_PAINT_LINEAR_GRADIENT */);
    } else if (el === "radialGradient") {
      nsvg__parseGradient(p, attr, 3 /* NSVG_PAINT_RADIAL_GRADIENT */);
    } else if (el === "stop") {
      nsvg__parseGradientStop(p, attr);
    }

    return;
  }

  if (el === "g") {
    nsvg__pushAttr(p);
    nsvg__parseAttribs(p, attr);
  } else if (el === "path") {
    if (p.pathFlag)
      return;

    nsvg__pushAttr(p);
    nsvg__parsePath(p, attr);
    nsvg__popAttr(p);
  } else if (el === "rect") {
    nsvg__pushAttr(p);
    nsvg__parseRect(p, attr);
    nsvg__popAttr(p);
  } else if (el === "circle") {
    nsvg__pushAttr(p);
    nsvg__parseCircle(p, attr);
    nsvg__popAttr(p);
  } else if (el === "ellipse") {
    nsvg__pushAttr(p);
    nsvg__parseEllipse(p, attr);
    nsvg__popAttr(p);
  } else if (el === "line") {
    nsvg__pushAttr(p);
    nsvg__parseLine(p, attr);
    nsvg__popAttr(p);
  } else if (el === "polyline") {
    nsvg__pushAttr(p);
    nsvg__parsePoly(p, attr, 0);
    nsvg__popAttr(p);
  } else if (el === "polygon") {
    nsvg__pushAttr(p);
    nsvg__parsePoly(p, attr, 1);
    nsvg__popAttr(p);
  } else if (el === "linearGradient") {
    nsvg__parseGradient(p, attr, 2 /* NSVG_PAINT_LINEAR_GRADIENT */);
  } else if (el === "radialGradient") {
    nsvg__parseGradient(p, attr, 3 /* NSVG_PAINT_RADIAL_GRADIENT */);
  } else if (el === "stop") {
    nsvg__parseGradientStop(p, attr);
  } else if (el === "defs") {
    p.defsFlag = 1;
  } else if (el === "svg") {
    nsvg__parseSVG(p, attr);
  } else if (el === "style") {
    p.styleFlag = 1;
  }
}

/* static */ /* void */ function nsvg__endElement(/* void */ ud,
                                                  /* const char */ el) {
  var /* NSVGparser */ p = ud;
  if (el === "g") {
    nsvg__popAttr(p);
  } else if (el === "path") {
    p.pathFlag = 0;
  } else if (el === "defs") {
    p.defsFlag = 0;
  } else if (el === "style") {
    p.styleFlag = 0;
  }
}

/* static */ /* void */ function nsvg__content(/* void */ ud,
                                               /* const char */ s) {
  if (!ud.styleFlag) return;

  var re = /.([a-zA-Z_][a-zA-Z0-9_-]*){([^}]*)}/mgi;
  var res;

  while ((res = re.exec(s)) !== null) {
    ud.styles[res[1]] = res[2];
  }
}

/* static */ /* void */ function nsvg__imageBounds(/* NSVGparser */ p,
                                                   /* float */ bounds) {
  var /* NSVGshape */ shape;
  shape = p.image.shapes;
  if (shape === null) {
    bounds[0] = (bounds[1] = (bounds[2] = (bounds[3] = 0.0)));
    return;
  }

  bounds[0] = shape.bounds[0];
  bounds[1] = shape.bounds[1];
  bounds[2] = shape.bounds[2];
  bounds[3] = shape.bounds[3];
  for (shape = shape.next; shape != null; shape = shape.next) {
    bounds[0] = nsvg__minf(bounds[0], shape.bounds[0]);
    bounds[1] = nsvg__minf(bounds[1], shape.bounds[1]);
    bounds[2] = nsvg__maxf(bounds[2], shape.bounds[2]);
    bounds[3] = nsvg__maxf(bounds[3], shape.bounds[3]);
  }
}

/* static */ /* float */ function nsvg__viewAlign(
    /* float */ content, /* float */ container, /* int */ type) {
  if (type === 0)
    return 0;
  else if (type === 2)
    return container - content;

  return (container - content) * 0.5;
}

/* static */ /* void */ function nsvg__scaleGradient(
    /* NSVGgradient */ grad, /* float */ tx, /* float */ ty, /* float */ sx,
    /* float */ sy) {
  grad.xform[0] *= sx;
  grad.xform[1] *= sx;
  grad.xform[2] *= sy;
  grad.xform[3] *= sy;
  grad.xform[4] += tx * sx;
  grad.xform[5] += ty * sx;
}

/* static */ /* void */ function nsvg__scaleToViewbox(/* NSVGparser */ p,
                                                      /* const char */ units) {
  var /* NSVGshape */ shape;
  var /* NSVGpath */ path;
  var /* float */ tx;
  var /* float */ ty;
  var /* float */ sx;
  var /* float */ sy;
  var /* float */ us;
  var /* float */ bounds = new Float32Array(4);
  var /* float */ t = new Float32Array(6);
  var /* float */ avgs;
  var /* int */ i;
  var /* float */ pt;
  nsvg__imageBounds(p, bounds);
  if (p.viewWidth === 0) {
    if (p.image.width > 0) {
      p.viewWidth = p.image.width;
    } else {
      p.viewMinx = bounds[0];
      p.viewWidth = bounds[2] - bounds[0];
    }
  }

  if (p.viewHeight === 0) {
    if (p.image.height > 0) {
      p.viewHeight = p.image.height;
    } else {
      p.viewMiny = bounds[1];
      p.viewHeight = bounds[3] - bounds[1];
    }
  }

  if (p.image.width === 0)
    p.image.width = p.viewWidth;

  if (p.image.height === 0)
    p.image.height = p.viewHeight;

  tx = -p.viewMinx;
  ty = -p.viewMiny;
  sx = p.viewWidth > 0 ? p.image.width / p.viewWidth : 0;
  sy = p.viewHeight > 0 ? p.image.height / p.viewHeight : 0;
  us = 1.0 / nsvg__convertToPixels(p, nsvg__coord(1.0, nsvg__parseUnits(units)),
                                   0.0, 1.0);
  if (p.alignType === 1) {
    sx = (sy = nsvg__minf(sx, sy));
    tx += nsvg__viewAlign(p.viewWidth * sx, p.image.width, p.alignX) / sx;
    ty += nsvg__viewAlign(p.viewHeight * sy, p.image.height, p.alignY) / sy;
  } else if (p.alignType === 2) {
    sx = (sy = nsvg__maxf(sx, sy));
    tx += nsvg__viewAlign(p.viewWidth * sx, p.image.width, p.alignX) / sx;
    ty += nsvg__viewAlign(p.viewHeight * sy, p.image.height, p.alignY) / sy;
  }

  sx *= us;
  sy *= us;
  avgs = (sx + sy) / 2.0;
  for (shape = p.image.shapes; shape !== null; shape = shape.next) {
    shape.bounds[0] = (shape.bounds[0] + tx) * sx;
    shape.bounds[1] = (shape.bounds[1] + ty) * sy;
    shape.bounds[2] = (shape.bounds[2] + tx) * sx;
    shape.bounds[3] = (shape.bounds[3] + ty) * sy;
    for (path = shape.paths; path != null; path = path.next) {
      path.bounds[0] = (path.bounds[0] + tx) * sx;
      path.bounds[1] = (path.bounds[1] + ty) * sy;
      path.bounds[2] = (path.bounds[2] + tx) * sx;
      path.bounds[3] = (path.bounds[3] + ty) * sy;
      for (i = 0; i < path.npts; i++) {
        pt = path.pts.slice(i * 2);
        pt[0] = (pt[0] + tx) * sx;
        pt[1] = (pt[1] + ty) * sy;
      }
    }

    if ((shape.fill.type === 2 /* NSVG_PAINT_LINEAR_GRADIENT */) ||
        (shape.fill.type === 3 /* NSVG_PAINT_RADIAL_GRADIENT */)) {
      nsvg__scaleGradient(shape.fill.gradient, tx, ty, sx, sy);
      arrcpy(t, shape.fill.gradient.xform);
      nsvg__xformInverse(shape.fill.gradient.xform, t);
    }

    if ((shape.stroke.type === 2 /* NSVG_PAINT_LINEAR_GRADIENT */) ||
        (shape.stroke.type === 3 /* NSVG_PAINT_RADIAL_GRADIENT */)) {
      nsvg__scaleGradient(shape.stroke.gradient, tx, ty, sx, sy);
      arrcpy(t, shape.stroke.gradient.xform);
      nsvg__xformInverse(shape.stroke.gradient.xform, t);
    }

    shape.strokeWidth *= avgs;
    shape.strokeDashOffset *= avgs;
    for (i = 0; i < shape.strokeDashCount; i++)
      shape.strokeDashArray[i] *= avgs;
  }
}

/* NSVGimage */ function nsvgParse(/* char */ input, /* const char */ units,
                                   /* float */ dpi) {
  var /* NSVGparser */ p;
  var /* NSVGimage */ ret = 0;
  p = nsvg__createParser();

  p.dpi = dpi;
  nsvg__parseXML(input, nsvg__startElement, nsvg__endElement, nsvg__content, p);
  nsvg__scaleToViewbox(p, units);
  ret = p.image;
  p.image = 0;
  return ret;
}

try {
  exports.parse = nsvgParse;

  exports.PAINT_NONE = 0;
  exports.PAINT_COLOR = 1;
  exports.PAINT_LINEAR_GRADIENT = 2;
  exports.PAINT_RADIAL_GRADIENT = 3;
  exports.SPREAD_PAD = 0;
  exports.SPREAD_REFLECT = 1;
  exports.SPREAD_REPEAT = 2;
  exports.JOIN_MITER = 0;
  exports.JOIN_ROUND = 1;
  exports.JOIN_BEVEL = 2;
  exports.CAP_BUTT = 0;
  exports.CAP_ROUND = 1;
  exports.CAP_SQUARE = 2;
  exports.FILLRULE_NONZERO = 0;
  exports.FILLRULE_EVENODD = 1;
  exports.FLAGS_VISIBLE = 1;
  exports.USER_SPACE = 0;
  exports.OBJECT_SPACE = 1;
  exports.UNITS_USER = 0;
  exports.UNITS_PX = 1;
  exports.UNITS_PT = 2;
  exports.UNITS_PC = 3;
  exports.UNITS_MM = 4;
  exports.UNITS_CM = 5;
  exports.UNITS_IN = 6;
  exports.UNITS_PERCENT = 7;
  exports.UNITS_EM = 8;
  exports.UNITS_EX = 9;
} catch(e) { }
