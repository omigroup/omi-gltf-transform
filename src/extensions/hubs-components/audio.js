import { ExtensionProperty  } from "@gltf-transform/core";
import { MOZ_HUBS_COMPONENTS } from "../MOZ_hubs_components.js";

export class HubsAudioComponent extends ExtensionProperty {
  static EXTENSION_NAME = MOZ_HUBS_COMPONENTS;
  static componentName = "audio";

  init() {
    this.extensionName = MOZ_HUBS_COMPONENTS;
    this.propertyType = "HubsAudioComponent";
    this.componentName = "audio";
  }

  getDefaults() {
    return Object.assign(super.getDefaults(), {
      src: "",
      controls: false,
      autoPlay: false,
      loop: false,
    });
  }

  read(context, componentDef) {
    if (componentDef.src) this.set("src", componentDef.src);
    if (componentDef.controls) this.set("controls", componentDef.controls);
    if (componentDef.autoPlay) this.set("autoPlay", componentDef.autoPlay);
    if (componentDef.loop) this.set("loop", componentDef.loop);
    return this;
  }

  write(context) {
    return {
      src: this.get("src"),
      controls: this.get("controls"),
      autoPlay: this.get("autoPlay"),
      loop: this.get("loop"),
    };
  }
}
