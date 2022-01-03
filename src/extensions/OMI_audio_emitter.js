import {
  COPY_IDENTITY,
  Extension,
  ExtensionProperty,
  GraphChild,
  PropertyType,
  Format
} from "@gltf-transform/core";

export const OMI_AUDIO_EMITTER = "OMI_audio_emitter";

export class OMIAudioEmitterExtension extends Extension {
  static EXTENSION_NAME = OMI_AUDIO_EMITTER;

  extensionName = OMIAudioEmitterExtension.EXTENSION_NAME;

  prewriteTypes = [PropertyType.BUFFER];

  createSceneAudioEmitters() {
    return new OMISceneAudioEmitters(this.doc.getGraph(), this);
  }

  createAudioEmitter() {
    return new OMIAudioEmitter(this.doc.getGraph(), this);
  }

  createAudioSource() {
    return new OMIAudioSource(this.doc.getGraph(), this);
  }

  // TODO: Read OMI_audio_emitter
  read() {}

  prewrite(context, propertyType) {
    if (
      propertyType !== PropertyType.BUFFER ||
      this.properties.size === 0 ||
      context.options.format !== Format.GLB
    ) {
      return this;
    }

    const audioSources = Array.from(this.properties).filter(
      (property) => property.propertyType === "OMIAudioSource"
    );

    for (const audioSource of audioSources) {
      const buffer = this.doc.getRoot().listBuffers()[0];

      if (!context.otherBufferViews.has(buffer)) {
        context.otherBufferViews.set(buffer, []);
      }

      context.otherBufferViews.get(buffer).push(audioSource._data);
    }

    return this;
  }

  write(context) {
    if (this.properties.size === 0) {
      return this;
    }

    const { json } = context.jsonDoc;

    const audioSources = Array.from(this.properties).filter(
      (property) => property.propertyType === "OMIAudioSource"
    );
    const audioSourceDefs = [];
    const audioSourceIndexMap = new Map();

    let audioSourceIndex = 0;

    for (const audioSource of audioSources) {
      const audioSourceDef = {};

      if (context.options.format === Format.GLB) {
        audioSourceDef.bufferView = context.otherBufferViewsIndexMap.get(audioSource._data);
        audioSourceDef.mimeType = "audio/mpeg";
      } else {
        const uri = `${context.options.basename}_audio${audioSourceIndex++}.mp3`;
        context.jsonDoc.resources[uri] = audioSource._data;
        audioSourceDef.uri = uri;
      }

      audioSourceDefs.push(audioSourceDef);
      audioSourceIndexMap.set(audioSource, audioSourceDefs.length - 1);
    }

    const audioEmitters = Array.from(this.properties).filter(
      (property) => property.propertyType === "OMIAudioEmitter"
    );
    const audioEmitterDefs = [];
    const audioEmitterIndexMap = new Map();

    for (const audioEmitter of audioEmitters) {
      const sourceIndex = audioSources.findIndex(
        (source) => audioEmitter.source.getChild() === source
      );

      if (sourceIndex === -1) {
        throw new Error("Error getting audio source index");
      }

      const audioEmitterDef = {
        type: audioEmitter._type,
        gain: audioEmitter._gain,
        loop: audioEmitter._loop,
        playing: audioEmitter._playing,
        source: sourceIndex,
      };

      if (audioEmitter._type === "positional") {
        audioEmitterDef.coneInnerAngle = audioEmitter._coneInnerAngle;
        audioEmitterDef.coneOuterAngle = audioEmitter._coneOuterAngle;
        audioEmitterDef.coneOuterGain = audioEmitter._coneOuterGain;
        audioEmitterDef.distanceModel = audioEmitter._distanceModel;
        audioEmitterDef.maxDistance = audioEmitter._maxDistance;
        audioEmitterDef.refDistance = audioEmitter._refDistance;
        audioEmitterDef.rolloffFactor = audioEmitter._rolloffFactor;
      }

      audioEmitterDefs.push(audioEmitterDef);
      audioEmitterIndexMap.set(audioEmitter, audioEmitterDefs.length - 1);
    }

    const root = this.doc.getRoot();

    // TODO: Support multiple scenes
    const scene = root.getDefaultScene();
    const sceneDef = json.scenes[json.scene];

    const sceneAudioEmitters = scene.getExtension(OMI_AUDIO_EMITTER);

    if (sceneAudioEmitters) {
      sceneDef.extensions = sceneDef.extensions || {};

      sceneDef.extensions[OMI_AUDIO_EMITTER] = {
        audioEmitters: sceneAudioEmitters._audioEmitters.map(
          (audioEmitter) => audioEmitterIndexMap.get(audioEmitter)
        ),
      };
    }

    root.listNodes().forEach((node) => {
      const nodeIndex = context.nodeIndexMap.get(node);
      const nodeDef = json.nodes[nodeIndex];

      const audioEmitter = node.getExtension(OMI_AUDIO_EMITTER);

      if (!audioEmitter) {
        return;
      }

      nodeDef.extensions = nodeDef.extensions || {};

      nodeDef.extensions[OMI_AUDIO_EMITTER] = {
        audioEmitter: audioEmitterIndexMap.get(audioEmitter),
      };
    });

    json.extensions = json.extensions || {};

    json.extensions[OMI_AUDIO_EMITTER] = {
      audioSources: audioSourceDefs,
      audioEmitters: audioEmitterDefs,
    };

    return this;
  }
}

export class OMISceneAudioEmitters extends ExtensionProperty {
  static EXTENSION_NAME = OMI_AUDIO_EMITTER;

  propertyType = "OMISceneAudioEmitters";
  parentTypes = [PropertyType.SCENE];
  extensionName = OMI_AUDIO_EMITTER;

  _audioEmitters = [];

  addAudioEmitter(audioEmitter) {
    this._audioEmitters.push(audioEmitter);
  }

  removeAudioEmitter(audioEmitter) {
    const index = this._audioEmitters.indexOf(audioEmitter);
    
    if (index !== -1) {
      this._audioEmitters.splice(index, 1);
    }
  }

  copy(other, resolve = COPY_IDENTITY) {
    super.copy(other, resolve);

    for (const audioEmitter of other._audioEmitters) {
      this.addAudioEmitter(resolve(audioEmitter.getChild()));
    }

    return this;
  }
}

export class OMIAudioEmitter extends ExtensionProperty {
  static EXTENSION_NAME = OMI_AUDIO_EMITTER;

  propertyType = "OMIAudioEmitter";
  parentTypes = ["OMISceneAudioEmitters", PropertyType.NODE];
  extensionName = OMI_AUDIO_EMITTER;

  _type = "positional";
  _gain = 1;
  _loop = false;
  _playing = false;
  _coneInnerAngle = Math.PI * 2;
  _coneOuterAngle = Math.PI * 2;
  _coneOuterGain = 0;
  _distanceModel = "inverse";
  _maxDistance = 10000;
  _refDistance = 1;
  _rolloffFactor = 1;

  constructor(graph, extension) {
    super(graph, extension);
    this.source = GraphChild(this, "source");
  }

  setSource(source) {
    this.source = this.graph.link("source", this, source);
    return this;
  }

  copy(other, resolve = COPY_IDENTITY) {
    super.copy(other, resolve);

    this._type = other._type;
    this._gain = other._gain;
    this._loop = other._loop;
    this._playing = other._playing;
    this._coneInnerAngle = other._coneInnerAngle;
    this._coneOuterAngle = other._coneOuterAngle;
    this._coneOuterGain = other._coneOuterGain;
    this._distanceModel = other._distanceModel;
    this._maxDistance = other._maxDistance;
    this._refDistance = other._refDistance;
    this._rolloffFactor = other._rolloffFactor;

    this.setSource(other.source ? resolve(other.source.getChild()) : null);

    return this;
  }
}

export class OMIAudioSource extends ExtensionProperty {
  static EXTENSION_NAME = OMI_AUDIO_EMITTER;
  propertyType = "OMIAudioSource";
  // TODO: Should we also be able to place these on the root?
  parentTypes = ["OMIAudioEmitter"];
  extensionName = OMI_AUDIO_EMITTER;

  setData(data) {
    this._data = data;
    return this;
  }

  copy(other, resolve = COPY_IDENTITY) {
    super.copy(other, resolve);

    // TODO: clone array buffer?
    this._data = other._data;

    return this;
  }
}
