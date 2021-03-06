Syntree.config_maps.node = {};
Syntree.config_maps.node.accept_unmapped_config = false;
Syntree.config_maps.node.map = {
    /**
     * Session-unique identifier.
     *
     * @type {number}
     *
     * @see Syntree.Lib.genId
     *
     * @memberof Syntree.Node
     * @instance
     */
    id: {
        require: 'number',
        default_value: '#undefined',
    },
    /**
     * This Node's x coordinate.
     *
     * @type {number}
     *
     * @memberof Syntree.Node
     * @instance
     */
    x: {
        require: 'number',
        default_value: 0,
    },
    /**
     * This Node's y coordinate.
     *
     * @type {number}
     *
     * @memberof Syntree.Node
     * @instance
     */
    y: {
        require: 'number',
        default_value: 0,
    },
    /**
     * Label content.
     *
     * @type {string}
     *
     * @memberof Syntree.Node
     * @instance
     */
    labelContent: {
        require: 'string',
        default_value: '',
    },
}

/**
 * @class
 * @classdesc Nodes are the meat of Syntree. They act like items in a linked list, containing references to their parents and children.
 * @extends Syntree.Element
 * @extends Syntree.SelectableElement
 */
Syntree.Node = function(config_matrix) {
    Syntree.Lib.config(config_matrix,this);
    Syntree.Lib.extend(Syntree.SelectableElement, Syntree.Node, this);

    /**
     * The last position that was updated to the visual display.
     *
     * @type {object}
     */
    this.lastSyncedPosition = undefined;

    // Relationships
    /**
     * This Node's parent Node.
     *
     * @type {Syntree.Node}
     */
    this.parent = undefined;

    /**
     * This Node's child Nodes.
     *
     * @type {Syntree.Node[]}
     */
    this.children = [];

    // Branches
    /**
     * Branch connecting to this Node's parent.
     *
     * @type {Syntree.Branch}
     */
    this.parentBranch = undefined;

    /**
     * Branches connecting to this Node's children.
     *
     * @type {Syntree.Branch[]}
     */
    this.childBranches = [];

    // States
    /**
     * Is this Node being edited?
     *
     * @type {Boolean}
     */
    this.editing = false;

    /**
     * Has this Node been saved at least once?
     * Used so we can autodelete Nodes on reverse navigation.
     *
     * @type {Boolean}
     */
    this.real = false;

    /**
     * This Node's cached label BBox.
     *
     * @type {object}
     */
    this._labelbbox;

    this.updateGraphics();
}

/**
 * Build needed graphical objects and compile them into a new instance of Graphic.
 *
 * @see Syntree.Graphic
 */
Syntree.Node.prototype.createGraphic = function() {
    // Editor
    var editorid = 'editor-' + this.id;
    $('.editor_container').append('<input id="' + editorid + '" class="editor">');
    var editor = $('#' + editorid);
    editor.hide();

    // Highlight
    var highlight = Syntree.snap.rect(this.x, this.y, 0, 0);
    highlight.attr({
        class: 'highlight highlight-' + this.id,
    });

    // Delete button
    var deleteButton = Syntree.snap.image('/resources/delete_button.svg', this.x, this.y, 10, 10);
    deleteButton.attr({
        class: 'delete_button delete_button-' + this.id,
    });

    // Label
    var label = Syntree.snap.text(this.x,this.y,this.labelContent);
    label.attr({
        'id': 'label-'+this.id,
        'class':'node-label',
    });

    var config_matrix = {
        elements_to_add: {
            label: {
                el_obj: label,
                include_in_svg_string: true,
            },
            highlight: {
                el_obj: highlight,
            },
            deleteButton: {
                el_obj: deleteButton,
            },
            editor: {
                el_obj: editor,
                attr_handler: function(el,attrs) {
                    el.css(attrs);
                }
            },
        },
        states_synced: {
            selected: false,
            labelContent: false,
            position: false,
        },
        data_object: this,
        update_map: {
            selected: {
                handler: 'boolean',
                state_name: 'selected',
                elements: {
                    highlight: {
                        stateTrueAttrs: {
                            fill: 'rgba(0,0,0,0.2)',
                        },
                        stateFalseAttrs: {
                            fill: 'none',
                        },
                    },
                    deleteButton: {
                        stateTrueAttrs: {
                            width: 10,
                        },
                        stateFalseAttrs: {
                            width: 0,
                        },
                    },
                },
            },
            labelContent: {
                handler: function(d,g) {
                    if (d.labelContent === '') {
                        g.getEl('label').node.textContent = '   ';
                    } else {
                        g.getEl('label').node.textContent = d.labelContent;
                    }
                    var bbox = d.getLabelBBox();
                    g.getEl('highlight').attr({
                        width: bbox.w + 10,
                        height: bbox.h + 10,
                    });
                    g.getEl('editor').css({
                        'width': bbox.w,
                        'height': bbox.h,
                    });
                }
            },
            position: {
                handler: function(d,g) {
                    var bbox = d.getLabelBBox();
                    g.getEl('label').attr({
                        x: d.x-(bbox.w/2),
                        y: d.y+(bbox.h/2),
                    });
                    d._labelbbox = undefined;
                    bbox = d.getLabelBBox();
                    g.getEl('highlight').attr({
                        x: bbox.x - 5,
                        y: bbox.y - 5,
                    });
                    g.getEl('deleteButton').attr({
                        x: bbox.x2,
                        y: bbox.y - 10,
                    });
                    g.getEl('editor').css({
                        'left': bbox.x,// + groupXOffset,
                        'top': bbox.y,// + groupYOffset,
                    });
                    d.lastSyncedPosition = {
                        x: d.getPosition().x,
                        y: d.getPosition().y
                    };
                }
            }
        }
    }

    this.graphic = new Syntree.Graphic(config_matrix)
}

/**
 * Get the position of this Node.
 * Does not include panning transform.
 *
 * @returns {object} - x and y coordinates
 *
 * @see Syntree.Node#x
 * @see Syntree.Node#y
 */
Syntree.Node.prototype.getPosition = function() {
    return {
        x: this.x,
        y: this.y
    };
}


/**
 * Accessor function for Syntree.Node#labelContent.
 *
 * @see Syntree.Node#labelContent
 */
Syntree.Node.prototype.getLabelContent = function() {
    return this.labelContent;
}

/**
 * Setter function for Syntree.Node#labelContent.
 *
 * @see Syntree.Node#labelContent
 */
Syntree.Node.prototype.setLabelContent = function(content) {
    this.graphic.unsync('labelContent');
    this.labelContent = content;
}

/**
 * Get this Node label's BBox.
 * Returns cached BBox if exists.
 *
 * @returns {object} - border box
 *
 * @see Syntree.Node#_labelbbox
 */
Syntree.Node.prototype.getLabelBBox = function() {
    if (this.graphic.getEl('label').node.textContent === '' || $('#' + this.graphic.getEl('label').attr('id')).length === 0) {
        var fakeHeight = 15;
        var fakeWidth = 10;
        return {
            x: this.x - fakeWidth/2,
            x2: this.x + fakeWidth/2,
            y: this.y - fakeHeight/2,
            y2: this.y + fakeHeight/2,
            w: fakeWidth,
            width: fakeWidth,
            height: fakeHeight,
            h: fakeHeight
        }
    } else {
        if (!Syntree.Lib.checkType(this._labelbbox, 'object')) {
            this._labelbbox = this.graphic.getEl('label').getBBox();
        }
        return this._labelbbox;
    }
}


/**
 * Accessor function for Syntree.Node#parent.
 *
 * @see Syntree.Node#parent
 */
Syntree.Node.prototype.getParent = function() {
    return this.parent;
}

/**
 * Accessor function for Syntree.Node#children.
 *
 * @see Syntree.Node#children
 */
Syntree.Node.prototype.getChildren = function() {
    return this.children;
}

/**
 * Get a path that acts like a border box for this Node's label.
 * Used to get intersections for movement arrows.
 *
 * @returns {string} - path string
 *
 * @see Syntree.Arrow
 */
Syntree.Node.prototype.getPath = function() {
    var bbox = this.getLabelBBox();
    var p = 10;
    var s = 'M ' + (bbox.x-p) + ' ' + (bbox.y-p) + ', ';
    s += 'H ' + (bbox.x2+p) + ', ';
    s += 'V ' + (bbox.y2+p) + ', ';
    s += 'H ' + (bbox.x-p) + ', ';
    s += 'V ' + (bbox.y-p) + ', ';
    return s;
}

/**
 * Grouped accessor function for selected, editing, real, and deleted.
 * Mostly a leftover from when I didn't know what I was doing.
 * Should probably turn this into something tht makes more sense, someday.
 *
 * @param {string} [which] - which state to return
 *
 * @returns {boolean|object} - either the boolean value of the state, or an object of state names mapped to booleans (if no state name provided)
 *
 * @see Syntree.Node#selected
 * @see Syntree.Node#editing
 * @see Syntree.Node#real
 * @see Syntree.Node#deleted
 */
Syntree.Node.prototype.getState = function(which) {
    switch (which) {
        case 'selected':
            return this.selected;
            break;
        case 'editing':
            return this.editing;
            break;
        case 'real':
            return this.real;
            break;
        case 'deleted':
            return this.deleted;
            break;
        default:
            return {
                selected: this.selected,
                editing: this.editing,
                real: this.real,
                deleted: this.deleted,
            }
    }
}

/**
 * Set this Node's x and y coordinates.
 *
 * @param {number} x - x coordinate
 * @param {number} y - y coordinate
 * @param {boolean} [propogate=true] - set coordinates of descendant Nodes as well
 *
 * @returns {object} - new x and y coordinates
 *
 * @see Syntree.Node#x
 * @see Syntree.Node#y
 */
Syntree.Node.prototype.move = function(x,y,propagate) {
    x = Syntree.Lib.checkArg(x, 'number');
    y = Syntree.Lib.checkArg(y, 'number');
    propagate = Syntree.Lib.checkArg(propagate, 'boolean', true);

    var oldX = this.x;
    var oldY = this.y;

    this.x = x;
    this.y = y;
    if (Syntree.Lib.checkType(this.parentBranch, 'branch')) {
        this.parentBranch.graphic.unsync('childPosition');
    }

    if (this.lastSyncedPosition.x != x || this.lastSyncedPosition.y != y) {
        this.graphic.unsync('position');
        if (this.childBranches.length > 0) {
            this.childBranches.map(function(b) {
                b.graphic.unsync('parentPosition');
            })
        }
    } else {
        this.graphic.sync('position');
        if (Syntree.Lib.checkType(this.parentBranch, 'branch')) {
            // this.parentBranch.graphic.sync('childPosition');
        }
        if (this.childBranches.length > 0) {
            this.childBranches.map(function(b) {
                // b.graphic.sync('parentPosition');
            })
        }
    }

    this._labelbbox = undefined;
    if (propagate) {
        var c = 0;
        while (c < this.children.length) {
            var deltaX = this.x - oldX;
            var deltaY = this.y - oldY;
            var thisChild = this.children[c];
            var pos = thisChild.getPosition();
            thisChild.move(pos.x + deltaX,pos.y + deltaY);
            c++;
        }
    }
    return {
        x: this.x,
        y: this.y,
    }
}

/**
 * Custom addition to Syntree.Element#delete.
 * Deletes connected Branches and Arrows as well.
 *
 * @see Syntree.Element#delete
 */
Syntree.Node.prototype.__delete = function() {
    this.real = false;
    if (Syntree.Lib.checkType(this.parentBranch, 'branch')) {
        this.parentBranch.delete();
    }
    if (Syntree.Lib.checkType(this.fromArrow, 'arrow')) {
        this.fromArrow.delete();
    }
    if (Syntree.Lib.checkType(this.toArrow, 'arrow')) {
        this.toArrow.delete();
    }
    if (Syntree.Lib.checkType(this.parent, 'node')) {
        this.parent.children.splice(this.parent.children.indexOf(this), 1);
        var tree = new Syntree.Tree({
            root: this.parent,
        })
        tree.distribute();
    }
}

/**
 * Custom addition to Syntree.SelectElement#deselect.
 * Deletes if is not real.
 *
 * @see Syntree.SelectableElement#deselect
 * @see Syntree.Node#real
 */
Syntree.Node.prototype.__deselect = function() {
    this.editingAction('cancel');
    if (!this.real) {
        this.delete();
    }
}

/**
 * Perform an editing action.
 *
 * @param {string} action - type of editing action: init, update, save, or cancel
 *
 * @see Syntree.Page#nodeEditing
 */
Syntree.Node.prototype.editingAction = function(action) {
    switch(action) {
        case 'init':
            this.editing = true;
            this.beforeEditLabelContent = this.labelContent;
            this.updateGraphics(false);
            this.graphic.getEl('editor').val(this.labelContent);
            this.graphic.getEl('editor').show();
            Syntree.Lib.focusNoScroll(this.graphic.getEl('editor'));
            break;
        case 'update':
            if (this.editing) {
                this.graphic.unsync('position');
                this._labelbbox = undefined;
                this.setLabelContent(this.graphic.getEl('editor').val());
                this.updateGraphics(false);
            }
            break;
        case 'save':
            this._labelbbox = undefined;
            if (!this.real) {
                this.real = true;
            }
            if (this.editing) {
                this.graphic.unsync('position');
                this.editing = false;
                this.setLabelContent(this.graphic.getEl('editor').val());
                this.graphic.getEl('editor').hide();
                this.graphic.getEl('editor').blur();
                this.beforeEditLabelContent = undefined;
                this._labelbbox = undefined;
                this.positionUnsynced = true;
                this.updateGraphics(false);
            }
            break;
        case 'cancel':
            if (this.editing) {
                this.graphic.unsync('position');
                this.editing = false;
                this.graphic.getEl('editor').hide();
                this.setLabelContent(this.beforeEditLabelContent);
                this.beforeEditLabelContent = undefined;
                this._labelbbox = undefined;
                this.updateGraphics(false);
            }
            break;
    }
}

/**
 * Custom addition to Syntree.Element#updateGraphics
 *
 * @see Syntree.Element#updateGraphics
 */
Syntree.Node.prototype.__updateGraphics = function(propagate) {
    propagate = Syntree.Lib.checkArg(propagate, 'boolean', false);
    if (this.positionUnsynced) {
        propagate = true;
    }

    // Branches
    if (Syntree.Lib.checkType(this.parentBranch, 'branch')) {
        this.parentBranch.updateGraphics();
    }
    for (i=0;i<this.childBranches.length;i++) {
        this.childBranches[i].updateGraphics();
    }
    if (Syntree.Lib.checkType(this.fromArrow, 'arrow')) {
        this.fromArrow.updateGraphics();
    }
    if (Syntree.Lib.checkType(this.toArrow, 'arrow')) {
        this.toArrow.updateGraphics();
    }

    if (propagate) {
        var c = 0;
        while (c < this.children.length) {
            this.children[c].updateGraphics();
            c++;
        }
    }
}

/**
 * Add a child at the specified index.
 *
 * @param {Syntree.Node} newNode - the Node to attach
 * @param {number} [index=Syntree.Node#children.length] - index at which to attach
 *
 * @see Syntree.Node#children
 */
Syntree.Node.prototype.addChild = function(newNode, index) {
    newNode = Syntree.Lib.checkArg(newNode, 'node');
    index = Syntree.Lib.checkArg(index, 'number', this.children.length);
    index = Syntree.Lib.checkArg(index, 'number');

    if (!this.real) {
        return;
    }
    newNode.parent = this;

    this.children.splice(index,0,newNode);

    var branch = new Syntree.Branch(this,newNode);
}

Syntree.Node.prototype.toString = function() {
    return '[object Node]';
}
