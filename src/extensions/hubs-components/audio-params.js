import { ExtensionProperty } from "@gltf-transform/core";
import { MOZ_HUBS_COMPONENTS } from "../MOZ_hubs_components.js";

export class HubsAudioParamsComponent extends ExtensionProperty {
  static EXTENSION_NAME = MOZ_HUBS_COMPONENTS;
  static componentName = "audio-params";

  init() {
    this.extensionName = MOZ_HUBS_COMPONENTS;
    this.propertyType = "HubsAudioParamsComponent";
    this.componentName = "audio-params";
  }

  getDefaults() {
    return Object.assign(super.getDefaults(), {
      audioType: "stereo",
      gain: 0.5,
      distanceModel: "inverse",
      rolloffFactor: 1,
      refDistance: 1,
      maxDistance: 10000,
      coneInnerAngle: 360,
      coneOuterAngle: 0,
      coneOuterGain: 0,
    });
  }

  read(context, componentDef) {
    if (componentDef.audioType) this.set("audioType", componentDef.audioType)
    if (componentDef.gain !== undefined) this.set("gain", componentDef.gain);
    if (componentDef.distanceModel) this.set("distanceModel", componentDef.distanceModel);
    if (componentDef.rolloffFactor !== undefined) this.set("rolloffFactor", componentDef.rolloffFactor);
    if (componentDef.refDistance !== undefined) this.set("refDistance", componentDef.refDistance);
    if (componentDef.maxDistance !== undefined) this.set("maxDistance", componentDef.maxDistance);
    if (componentDef.coneInnerAngle !== undefined) this.set("coneInnerAngle", componentDef.coneInnerAngle);
    if (componentDef.coneOuterAngle !== undefined) this.set("coneOuterAngle", componentDef.coneOuterAngle);
    if (componentDef.coneOuterGain !== undefined) this.set("coneOuterGain", componentDef.coneOuterGain);
    return this;
  }

  write(context) {
    return {
      audioType: this.get("audioType"),
      gain: this.get("gain"),
      distanceModel: this.get("distanceModel"),
      rolloffFactor: this.get("rolloffFactor"),
      refDistance: this.get("refDistance"),
      maxDistance: this.get("maxDistance"),
      coneInnerAngle: this.get("coneInnerAngle"),
      coneOuterAngle: this.get("coneOuterAngle"),
      coneOuterGain: this.get("coneOuterGain"),
    };
  }
}
