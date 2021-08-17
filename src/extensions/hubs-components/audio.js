import { HubsComponent } from "../MOZ_hubs_components.js";

export class HubsAudioComponent extends HubsComponent {
  static componentName = "audio";

  componentName = "audio";

  read(context, componentDef) {
    this.src = componentDef.src;
    this.controls = componentDef.controls || false;
    this.autoPlay = componentDef.autoPlay || false;
    this.loop = componentDef.loop || false;
    return this;
  }

  write(context) {
    return {
      src: this.src,
      controls: this.controls,
      autoPlay: this.autoPlay,
      loop: this.loop,
    };
  }

  clone() {
    return new HubsAudioComponent().copy(this);
  }

  copy(other) {
    this.src = other.src;
    this.controls = other.controls;
    this.autoPlay = other.autoPlay;
    this.loop = other.loop;
    return this;
  }
}