// from gnome-shell-cairo clock extension

const { Clutter, GObject, GLib, PangoCairo, Pango } = imports.gi;

const Cairo = imports.cairo;
let size = 400;

var xCalendar = GObject.registerClass(
  {
    Properties: {},
    Signals: {},
  },
  class xCalendar extends Clutter.Actor {
    _init(x) {
      super._init();

      if (x) size = x;

      this._canvas = new Clutter.Canvas();
      this._canvas.connect('draw', this.on_draw.bind(this));
      this._canvas.invalidate();
      this._canvas.set_size(size, size);
      this.set_size(size, size);
      this.set_content(this._canvas);
      this.reactive = false;
    }

    draw_line(ctx, color, width, angle, len) {
      ctx.save();
      ctx.rotate(angle);
      this.setcolor(ctx, color, 1); //指针颜色
      ctx.setLineWidth(width);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, len);
      ctx.stroke();
      ctx.restore(); //消除旋转的角度
    }

    draw_rounded_rect(ctx, color, x, y, h_size, v_size, line_width, border_radius) {
      ctx.save();
      this.setcolor(ctx, color, 1); //色
      ctx.translate(x, y);
      ctx.setLineWidth(line_width);
      ctx.moveTo(border_radius, 0);
      ctx.lineTo(h_size - border_radius, 0);
      // ctx.lineTo(h_size, border_radius);
      ctx.curveTo(h_size - border_radius, 0, h_size, 0, h_size, border_radius);
      ctx.lineTo(h_size, v_size - border_radius);
      // ctx.lineTo(h_size - border_radius, h_size);
      ctx.curveTo(h_size, v_size - border_radius, h_size, v_size, h_size - border_radius, v_size);
      ctx.lineTo(border_radius, v_size);
      // ctx.lineTo(0, h_size - border_radius);
      ctx.curveTo(border_radius, v_size, 0, v_size, 0, v_size - border_radius);
      ctx.lineTo(0, border_radius);
      ctx.curveTo(0, border_radius, 0, 0, border_radius, 0);
      ctx.fill();
      ctx.restore(); //消除旋转的角度
    }

    draw_text(ctx, showtext, font = "DejaVuSans 42") {
      ctx.save();
      let pl = PangoCairo.create_layout(ctx);
      pl.set_text(showtext, -1);
      pl.set_font_description(Pango.FontDescription.from_string(font));
      PangoCairo.update_layout(ctx, pl);
      let [w, h] = pl.get_pixel_size();
      ctx.relMoveTo(-w / 2, -h / 2);
      PangoCairo.show_layout(ctx, pl);
      ctx.relMoveTo(w / 2, 0);
      ctx.restore();
      return [w, h]
    }

    setcolor(ctx, colorstr, alpha) {
      const [, cc] = Clutter.Color.from_string(colorstr);
      ctx.setSourceRGBA(cc.red, cc.green, cc.blue, alpha);
    }

    on_draw(canvas, ctx, width, height) {
      const hd_color = 'red';
      const bg_color = 'white';
      const date_color = 'red';

      ctx.setOperator(Cairo.Operator.CLEAR);
      ctx.paint();

      ctx.translate(size / 2, size / 2); //窗口中心为坐标原点。
      ctx.setLineWidth(1);
      ctx.setLineCap(Cairo.LineCap.ROUND);
      ctx.setOperator(Cairo.Operator.SOURCE);

      let bgSize = size * 0.7;
      let offset = size - bgSize;

      // ctx.save();
      // this.setcolor(ctx, bg_color, 1.0); //底
      // ctx.arc(0, 0, bgSize / 2 - bgSize / 20, 0, 2 * Math.PI);
      // ctx.fill();
      // ctx.restore();

      this.draw_rounded_rect(ctx, bg_color, -size/2 + offset/2, -size/2 + offset/2, bgSize, bgSize, 1, 8);
      this.setcolor(ctx, date_color, 1.0);
      ctx.moveTo(0, 0);
      this.draw_text(ctx, "29");
      // this.draw_rounded_rect(ctx, hd_color, -size/2 + offset/2, -size/2 + offset/2, bgSize, 16, 1, 8);

      const d0 = new Date(); //时间
      
      // draw date here

      ctx.$dispose(); // 释放context，有用？
    }

    destroy() {}
  }
);
