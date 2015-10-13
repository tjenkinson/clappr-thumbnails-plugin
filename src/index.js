import {UICorePlugin, Events} from 'clappr'
import './style.sass'

export default class ScrubThumbnailsPlugin extends UICorePlugin {
  get name() { return 'scrub-thumbnails' }

  get attributes() {
    return {
      'class': this.name
    }
  }

  bindEvents() {
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_MOUSEMOVE_SEEKBAR, this._show)
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_MOUSELEAVE_SEEKBAR, this._hide)
  }

  _appendElToMediaControl() {
    console.log("_appendElToMediaControl")
    this.core.mediaControl.$el.prepend(this.el)
  }

  _onContainerChanged() {
    console.log("container changed")
  }

  _show() {
    console.log("show")
    this.$el.removeClass("hidden")
  }

  _hide() {
    console.log("hide")
    this.$el.addClass("hidden")
  }

  destroy() {
    console.log("destroying")
  }

  render() {
    this.$el.html("<div class='something'>testing</div>")
    this._hide()
    this._appendElToMediaControl()
    return this
  }
}
