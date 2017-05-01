Syntree.config_maps.graphic = {};
Syntree.config_maps.graphic.accept_unmapped_config = false;
Syntree.config_maps.graphic.map = {
    /**
     * Elements to add to Graphic.
     * Initialization property only.
     *
     * @type {object}
     * @memberof Syntree.Graphic
     * @instance
     */
    elements_to_add: {
        require: 'object',
        default_value: {},
    },
    /**
     * States of this instance's data object that need to be mapped to graphical updates.
     *
     * @type {object}
     * @memberof Syntree.Graphic
     * @instance
     */
    states_synced: {
        require: 'object',
        default_value: {},
    },
    /**
     * Information about how to update graphical elements based on state changes.
     *
     * @type {object}
     * @memberof Syntree.Graphic
     * @instance
     */
    update_map: {
        require: 'object',
        default_value: '#undefined',
    },
    /**
     * The Element that this Graphic is a member of.
     *
     * @type {Syntree.Element}
     * @memberof Syntree.Graphic
     * @instance
     */
    data_object: {
        require: ['node', 'branch', 'arrow'],
    },
}

/**
 * @class
 * @classdesc Instantiated for each new [Element]{@link Syntree.Element}. Manages all graphical representation.
 */
Syntree.Graphic = function(config_matrix) {
    /**
     * All the graphical elements.
     *
     * @type {object}
     * @prop {object} element.el_obj - the actual Snap Element or jQuery Object
     * @prop {function} element.attr_handler - a function to handle attribute updating
     * @prop {boolean} element.include_in_svg_string - whether or not to include this element in the SVG string
     */
    this.elements = {};
    Syntree.Lib.config(config_matrix, this);

    for (name in this.elements_to_add) {
        this.addElement(name, this.elements_to_add[name]);
    }
    delete this.elements_to_add;
}

/**
 * Add a graphical element.
 *
 * @param {string} name - the name of the element
 * @param {object} element - data about the element
 * @param {object} element.el_obj - the actual Snap Element or jQuery Object
 * @param {function} [element.attr_handler=Syntree.Graphic._defaultAttrHandler] - a function to handle attribute updating
 * @param {boolean} [element.include_in_svg_string=false] - whether or not to include this element in the SVG string
 */
Syntree.Graphic.prototype.addElement = function(name, element) {
    this.elements[name] = {};
    this.elements[name].el_obj = Syntree.Lib.checkArg(element.el_obj, 'object');
    this.elements[name].attr_handler = Syntree.Lib.checkArg(element.attr_handler, 'function', this._defaultAttrHandler);
    this.elements[name].include_in_svg_string = Syntree.Lib.checkArg(element.include_in_svg_string, 'boolean', false);
}

/**
 * Get an SVG string represnting all elements marked with include_in_svg_string.
 *
 * @returns {string} - string of SVG markup
 *
 * @see Syntree.Graphic#addElement
 */
Syntree.Graphic.prototype.getSVGString = function() {
    var s = '';
    for (name in this.elements) {
        if (this.elements[name].include_in_svg_string) {
            s += this.getEl(name).node.outerHTML;
        }
    }
    return s;
}

/**
 * The default attr handler for graphical elements.
 *
 * @param {object} element - a Snap Element (or other graphical element)
 * @param {object} attrs - attrs to set
 *
 * @see Syntree.Graphic#elements
 */
Syntree.Graphic.prototype._defaultAttrHandler = function(element, attrs) {
    element.attr(attrs);
}

/**
 * Get all graphical elements.
 *
 * @returns {object} - all elements
 *
 * @see Syntree.Graphic#elements
 */
Syntree.Graphic.prototype.getAllEls = function() {
    return this.elements;
}

/**
 * Get an element by name.
 *
 * @param {string} name - name of the element
 *
 * @see Syntree.Graphic#elements
 */
Syntree.Graphic.prototype.getEl = function(name) {
    return this.elements[name].el_obj;
}

/**
 * Tell this Graphic instance that the state with state_name has been changed in the data object.
 *
 * @param {string} state_name - state name
 *
 * @see Syntree.Graphic#states_synced
 * @see Syntree.Graphic#data_object
 */
Syntree.Graphic.prototype.unsync = function(state_name) {
    this.states_synced[state_name] = false;
}

/**
 * Tell this Graphic instance that the state with state_name is correctly represented in the graphical layer.
 *
 * @see Syntree.Graphic#unsync
 */
Syntree.Graphic.prototype.sync = function(state_name) {
    this.states_synced[state_name] = true;
}

/**
 * Update all graphical elements.
 */
Syntree.Graphic.prototype.update = function() {
    for (state in this.states_synced) {
        if (Syntree.Lib.checkType(this.states_synced[state], 'boolean') && !this.states_synced[state]) {
            var state_obj = this.update_map[state];
            if (state_obj.handler === 'boolean') {
                this._handlerBoolean(state_obj);
            } else if (Syntree.Lib.checkType(state_obj.handler, 'function')) {
                state_obj.handler(this.data_object, this);
            }
            this.states_synced[state] = true;
        }
    }
    if (Syntree.Lib.checkType(this.update_map['#default'], 'function')) {
        this.update_map['#default'](this.data_object, this);
    }
}

/**
 * Delete all graphical elements.
 */
Syntree.Graphic.prototype.delete = function() {
    for (name in this.elements) {
        if (Syntree.Lib.checkType(this.getEl(name).node, 'object')) {
            this.getEl(name).node.remove();
        } else {
            this.getEl(name).remove();
        }
    }
}

/**
 * Handler for data states of type boolean -- for example, Syntree.SelectableElement#selected.
 */
Syntree.Graphic.prototype._handlerBoolean = function(state_obj) {
    var d = this.data_object;

    for (name in state_obj.elements) {
        var el = this.elements[name];
        var state_el_data = state_obj.elements[name];
        if (d[state_obj.state_name]) {
            el.attr_handler(el.el_obj, state_el_data.stateTrueAttrs);
        } else {
            el.attr_handler(el.el_obj, state_el_data.stateFalseAttrs);
        }
    }
}

Syntree.Graphic.prototype.toString = function() {
    return '[object Graphic]'
}