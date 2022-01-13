export class Config {
  constructor(configObj) {
    this.palette = configObj.palette;
    this.useAdditiveBlending = configObj.useAdditiveBlending;
    this.numParticles = configObj.numParticles;
    this.vMin = configObj.vMin;
    this.maxSpeed = configObj.maxSpeed;
    this.minSpeed = configObj.minSpeed;
    this.sizeBase = configObj.sizeBase;
    this.paletteSaturation = configObj.paletteSaturation;
    this.paletteOffset = configObj.paletteOffset;
    this.paletteScale = configObj.paletteScale;
    this.particleOpacity = configObj.particleOpacity;
    this.spawnSphereDiameter = configObj.spawnSphereDiameter;
    this.noiseSeed = configObj.noiseSeed;
    this.noiseScale = configObj.noiseScale;
    this.noiseType = configObj.noiseType;
    this.extinctionMethod = configObj.extinctionMethod;
    this.lifeSpanMin = configObj.lifeSpanMin;
    this.lifeSpanMax = configObj.lifeSpanMax;
    this.extinctionDistance = configObj.extinctionDistance;
    this.useSineWaveOpacity = configObj.useSineWaveOpacity;
    this.minSineOpacity = configObj.minSineOpacity;
    this.maxSineOpacity = configObj.maxSineOpacity;
    this.sineFrequency = configObj.sineFrequency;
    this.noiseZOffset = configObj.noiseZOffset;
    this.noiseXOffset = configObj.noiseXOffset;
    this.noiseYOffset = configObj.noiseYOffset;
    this.customResolution = configObj.customResolution;
    this.customResolutionX = configObj.customResolutionX;
    this.customResolutionY = configObj.customResolutionY;
    this.cameraDistance = configObj.cameraDistance;
  }

  get() {
    return {
      palette: this.palette,
      useAdditiveBlending: this.useAdditiveBlending,
      numParticles: this.numParticles,
      vMin: this.vMin,
      maxSpeed: this.maxSpeed,
      minSpeed: this.minSpeed,
      sizeBase: this.sizeBase,
      paletteSaturation: this.paletteSaturation,
      paletteOffset: this.paletteOffset,
      paletteScale: this.paletteScale,
      particleOpacity: this.particleOpacity,
      noiseSeed: this.noiseSeed,
      noiseScale: this.noiseScale,
      noiseType: this.noiseType,
      extinctionMethod: this.extinctionMethod,
      lifeSpanMin: this.lifeSpanMin,
      lifeSpanMax: this.lifeSpanMax,
      extinctionDistance: this.extinctionDistance,
      useSineWaveOpacity: this.useSineWaveOpacity,
      minSineOpacity: this.minSineOpacity,
      maxSineOpacity: this.maxSineOpacity,
      sineFrequency: this.sineFrequency,
      noiseZOffset: this.noiseZOffset,
      noiseXOffset: this.noiseXOffset,
      noiseYOffset: this.noiseYOffset,
      customResolution: this.customResolution,
      customResolutionX: this.customResolutionX,
      customResolutionY: this.customResolutionY,
      cameraDistance: this.cameraDistance,
    };
  }

  set(configObj) {
    this.palette = configObj.palette ?? this.palette;
    this.useAdditiveBlending =
      configObj.useAdditiveBlending ?? this.useAdditiveBlending;
    this.numParticles = configObj.numParticles ?? this.numParticles;
    this.vMin = configObj.vMin ?? this.vMin;
    this.maxSpeed = configObj.maxSpeed ?? this.maxSpeed;
    this.minSpeed = configObj.minSpeed ?? this.minSpeed;
    this.sizeBase = configObj.sizeBase ?? this.sizeBase;
    this.paletteSaturation =
      configObj.paletteSaturation ?? this.paletteSaturation;
    this.paletteOffset = configObj.paletteOffset ?? this.paletteOffset;
    this.paletteScale = configObj.paletteScale ?? this.paletteScale;
    this.particleOpacity = configObj.particleOpacity ?? this.particleOpacity;
    this.spawnSphereDiameter =
      configObj.spawnSphereDiameter ?? this.spawnSphereDiameter;
    this.noiseSeed = configObj.noiseSeed ?? this.noiseSeed;
    this.noiseScale = configObj.noiseScale ?? this.noiseScale;
    this.noiseType = configObj.noiseType ?? this.noiseType;
    this.extinctionMethod = configObj.extinctionMethod ?? this.extinctionMethod;
    this.lifeSpanMin = configObj.lifeSpanMin ?? this.lifeSpanMin;
    this.lifeSpanMax = configObj.lifeSpanMax ?? this.lifeSpanMax;
    this.extinctionDistance =
      configObj.extinctionDistance ?? this.extinctionDistance;
    this.useSineWaveOpacity =
      configObj.useSineWaveOpacity ?? this.useSineWaveOpacity;
    this.minSineOpacity = configObj.minSineOpacity ?? this.minSineOpacity;
    this.maxSineOpacity = configObj.maxSineOpacity ?? this.maxSineOpacity;
    this.sineFrequency = configObj.sineFrequency ?? this.sineFrequency;
    this.noiseZOffset = configObj.noiseZOffset ?? this.noiseZOffset;
    this.noiseXOffset = configObj.noiseXOffset ?? this.noiseXOffset;
    this.noiseYOffset = configObj.noiseYOffset ?? this.noiseYOffset;
    this.customResolution = configObj.customResolution ?? this.customResolution;
    this.customResolutionX =
      configObj.customResolutionX ?? this.customResolutionX;
    this.customResolutionY =
      configObj.customResolutionY ?? this.customResolutionY;
    this.cameraDistance = configObj.cameraDistance ?? this.cameraDistance;
  }

  getParam(key) {
    return this[key];
  }

  setParam(key) {
    this[key] = value;
  }
}
