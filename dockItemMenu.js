'use strict';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as BoxPointer from 'resource:///org/gnome/shell/ui/boxpointer.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { trySpawnCommandLine } from './utils.js';
// import { trySpawnCommandLine } from 'resource:///org/gnome/shell/misc/util.js';

import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Clutter from 'gi://Clutter';
import St from 'gi://St';

export const DockItemList = GObject.registerClass(
  {},
  class DockItemList extends St.Widget {
    _init(renderer, params) {
      super._init({
        name: 'DockItemList',
        reactive: true,
        // style_class: 'hi',
        ...params,
      });

      this.connect('button-press-event', (obj, evt) => {
        if (!this._box || !this._box.get_children().length) {
          return Clutter.EVENT_PROPAGATE;
        }
        this.slideOut();
        return Clutter.EVENT_PROPAGATE;
      });
    }

    slideIn(target, list) {
      if (this._box) {
        this.remove_child(this._box);
        this._box = null;
      }

      if (!list.length) return;

      this.opacity = 0;

      let dock = this.dock;
      this.x = dock._monitor.x;
      this.y = dock._monitor.y;
      this.width = dock._monitor.width;
      this.height = dock._monitor.height;

      this._hidden = false;
      this._hiddenFrames = 0;

      this._target = target;

      this._box = new St.Widget({ style_class: '-hi' });
      let iconSize = dock.dash._box.first_child._icon.width;
      // scaling hack - temporary
      let iconAdjust = 1;
      if (dock._scaleFactor != 1 && dock._scaleFactor != 2) {
        iconAdjust += 0.5;
      }

      list.forEach((l) => {
        let w = new St.Widget({});
        let icon = new St.Icon({
          icon_name: l.icon,
          reactive: true,
          track_hover: true,
        });
        icon.set_icon_size(iconSize * iconAdjust);
        this._box.add_child(w);
        let label = new St.Label({ style_class: 'dash-label' });
        let short = (l.name ?? '').replace(/(.{32})..+/, '$1...');
        label.text = short;
        w.add_child(icon);
        w.add_child(label);
        w._icon = icon;
        w._label = label;
        label.opacity = 0;

        icon.connect('button-press-event', () => {
          // let path = Gio.File.new_for_path(`Downloads/${l.name}`).get_path();
          let path = l.path;
          let cmd = `xdg-open "${path}"`;

          if (l.type.includes('directory')) {
            cmd = `nautilus --select "${path}"`;
          }
          if (l.type.includes('exec')) {
            cmd = l.exec;
          }

          this.visible = false;
          this.dock._maybeBounce(this._target.child);

          try {
            console.log(cmd);
            trySpawnCommandLine(cmd);
          } catch (err) {
            console.log(err);
          }
        });
      });

      this.add_child(this._box);

      let tp = this._target.get_transformed_position();
      let angleInc = 0 + 2.5 * dock.extension.items_pullout_angle;
      let startAngle = 270 + 1 * angleInc;
      let angle = startAngle;
      let rad = iconSize * dock._scaleFactor;

      let ox = 0;
      let oy = -rad / 4;

      let children = this._box.get_children();
      children.reverse();
      children.forEach((l) => {
        let hX = Math.cos(angle * 0.0174533);
        let hY = Math.sin(angle * 0.0174533);
        let hl = Math.sqrt(hX * hX + hY * hY);
        hX /= hl;
        hY /= hl;
        hX *= rad;
        hY *= rad;

        l.x = tp[0] - this.x + ox;
        l.y = tp[1] - this.y + oy;

        ox += hX; // * 0.85;
        oy += hY;
        angle += angleInc;

        l.rotation_angle_z = angle - startAngle;
      });

      let first = children[0];
      children.forEach((l) => {
        l._ox = first.x;
        l._oy = first.y;
        l._oz = 0;
        l._label.opacity = 0;
        l._x = l.x;
        l._y = l.y - rad * 0.8;
        l._rotation_angle_z = l.rotation_angle_z;
        l.x = first.x;
        l.y = first.y;
        l.rotation_angle_z = 0;
      });
    }

    slideOut() {
      if (!this._hidden) {
        this._hidden = true;
        this._hiddenFrames = 80;
      }
    }
  }
);
