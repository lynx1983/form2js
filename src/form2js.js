/**
 * Copyright (c) 2010 Maxim Vasiliev
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * @author Maxim Vasiliev
 * Date: 09.09.2010
 * Time: 19:02:33
 */

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else {
		root.form2js = factory();
	}
}(this, function ()
{
	"use strict";

	function checkObjectIsArray(obj) {
		var i, counter = 0;
		for(i in obj) {
			if(obj.hasOwnProperty(i)) {
				if(i == counter || !isNaN(parseInt(i, 10)) || i === "") {
					counter += 1;
				} else {
					return false;
				}
			}
		}

		return true;
	}

	function convertObjectToArray(obj) {
		var i, array = [];
		for(i in obj) {
			if(obj.hasOwnProperty(i)) {
				array.push(obj[i]);
			}
		}
		return array;
	}

	function deepObjectToArray(obj) {
		var i;
		for(i in obj) {
			if(obj.hasOwnProperty(i)) {
				if(Object.prototype.toString.call(obj[i]) === "[object Object]") {
					obj[i] = deepObjectToArray(obj[i]);					

					if(checkObjectIsArray(obj[i])) {
						obj[i] = convertObjectToArray(obj[i]);
					}
				}
			}
		}
		return obj;
	}

	/**
	 * Returns form values represented as Javascript object
	 * "name" attribute defines structure of resulting object
	 *
	 * @param rootNode {Element|String} root form element (or it's id) or array of root elements
	 * @param delimiter {String} structure parts delimiter defaults to '.'
	 * @param skipEmpty {Boolean} should skip empty text values, defaults to true
	 * @param nodeCallback {Function} custom function to get node value
	 * @param useIdIfEmptyName {Boolean} if true value of id attribute of field will be used if name of field is empty
	 */

	function form2js(rootNode, delimiter, skipEmpty, nodeCallback, useIdIfEmptyName) {
		var i, j, l, fl, node, nodes = [], nodeName, callbackResult, name, value, formFields, reg, result = {};

		if (typeof skipEmpty == 'undefined' || skipEmpty == null) skipEmpty = true;
		if (typeof delimiter == 'undefined' || delimiter == null) delimiter = '.';
		if (arguments.length < 5) useIdIfEmptyName = false;

		rootNode = typeof rootNode == 'string' ? document.getElementById(rootNode) : rootNode;

		if (rootNode.constructor == Array || (typeof NodeList != "undefined" && rootNode.constructor == NodeList)) {
			while(currNode = rootNode[i++]) nodes.push[rootNode[i++]];
		} else {
			nodes.push(rootNode);
		}

		reg = new RegExp("\\[(" + delimiter + "*?)\\]", "g");

		for(j = 0, fl = nodes.length; j < fl; j++) {
			formFields = nodes[j].querySelectorAll('select,input,textarea');

			for(i = 0, l = formFields.length; i < l; i++) {
				node = formFields[i];
				nodeName = getFieldName(node, useIdIfEmptyName);
				if(nodeName) {
					name = nodeName.replace(reg, ".$1");
					callbackResult = nodeCallback && nodeCallback(node);

					if(callbackResult && callbackResult.name) {
						name = callbackResult.name;
						value = callbackResult.value;
					} else {
						value = getNodeValue(node);
					}

					if(value != null || !skipEmpty) {
						createDeepProperty(result, name, value, delimiter);
					}
				}
			}
		}
		
		return deepObjectToArray(result);
	}

	function createDeepProperty(obj, name, value) {
		var path = name.split('.'),
			parent = obj, i, l;

		for(i = 0, l = path.length - 1; i < l; i++) {
			if(typeof parent[path[i]] === "undefined") parent[path[i]] = {}
			parent = parent[path[i]];
		}

		parent[path[path.length-1]] = value;
	}

	function getFieldName(node, useIdIfEmptyName) {
		if (node.name && node.name != '') return node.name;
		else if (useIdIfEmptyName && node.id && node.id != '') return node.id;
		else return '';
	}

	function getNodeValue(node) {
		if (node.disabled) return null;
		
		switch (node.nodeName) {
			case 'INPUT':
			case 'TEXTAREA':
				switch (node.type.toLowerCase()) {
					case 'radio':
						if (node.checked && node.value === "false") return false;
					case 'checkbox':
                        if (node.checked && node.value === "true") return true;
                        if (!node.checked && node.value === "true") return false;
						if (node.checked) return node.value;
						break;

					case 'button':
					case 'reset':
					case 'submit':
					case 'image':
						return '';
						break;

					default:
						return node.value;
						break;
				}
				break;

			case 'SELECT':
				return getSelectValue(node);
				break;

			default:
				break;
		}

		return null;
	}

	function getSelectValue(selectNode)
	{
		var multiple = selectNode.multiple,
			result = [],
			options,
			i, l;

		if (!multiple) return selectNode.value;

		for (options = selectNode.getElementsByTagName("option"), i = 0, l = options.length; i < l; i++)
		{
			if (options[i].selected) result.push(options[i].value);
		}

		return result;
	}

	return form2js;

}));