import { HubsComponent } from "../MOZ_hubs_components.js";

export class HubsAudioParamsComponent extends HubsComponent {
  static componentName = "audio-params";

  componentName = "audio-params";

  read(context, componentDef) {
    this.audioType = componentDef.audioType ? componentDef.audioType : "stereo";
    this.gain = componentDef.gain == undefined ? 0.5 : componentDef.gain;
    this.distanceModel = componentDef.distanceModel || "inverse";
    this.rolloffFactor =
      componentDef.rolloffFactor == undefined ? 1 : componentDef.rolloffFactor;
    this.refDistance =
      componentDef.refDistance == undefined ? 1 : componentDef.refDistance;
    this.maxDistance =
      componentDef.maxDistance == undefined ? 10000 : componentDef.maxDistance;
    this.coneInnerAngle =
      componentDef.coneInnerAngle == undefined
        ? 360
        : componentDef.coneInnerAngle;
    this.coneOuterAngle =
      componentDef.coneOuterAngle == undefined
        ? 0
        : componentDef.coneOuterAngle;
    this.coneOuterGain =
      componentDef.coneOuterGain == undefined ? 0 : componentDef.coneOuterGain;
    return this;
  }

  write(context) {
    return {
      audioType: this.audioType,
      gain: this.gain,
      distanceModel: this.distanceModel,
      rolloffFactor: this.rolloffFactor,
      refDistance: this.refDistance,
      maxDistance: this.maxDistance,
      coneInnerAngle: this.coneInnerAngle,
      coneOuterAngle: this.coneOuterAngle,
      coneOuterGain: this.coneOuterGain,
    };
  }

  clone() {
    return new HubsAudioParamsComponent().copy(this);
  }

  copy(other) {
    this.audioType = other.audioType;
    this.gain = other.gain;
    this.distanceModel = other.distanceModel;
    this.rolloffFactor = other.rolloffFactor;
    this.refDistance = other.refDistance;
    this.maxDistance = other.maxDistance;
    this.coneInnerAngle = other.coneInnerAngle;
    this.coneOuterAngle = other.coneOuterAngle;
    this.coneOuterGain = other.coneOuterGain;
    return this;
  }
}
