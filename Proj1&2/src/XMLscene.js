var DEGREE_TO_RAD = Math.PI / 180;

/**
 * XMLscene class, representing the scene that is to be rendered.
 */
class XMLscene extends CGFscene {
    /**
     * @constructor
     * @param {MyInterface} myinterface 
     */
    constructor(myinterface) {
        super();

        this.interface = myinterface;

        this.last = 0;
    }

    /**
     * Initializes the scene, setting some WebGL defaults, initializing the camera and the axis.
     * @param {CGFApplication} application
     */
    init(application) {
        super.init(application);

        this.sceneInited = false;

        this.enableTextures(true);

        this.gl.clearDepth(100.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.axis = new CGFaxis(this);
        this.setUpdatePeriod(33.3);
    }

    /**
     * Initializes the scene cameras.
     */
    initCameras() {
        this.cameras = [];
        this.securityCameras = [];
        this.camerasIDs = [];

        //Reads the views from the scene graph.
        for (var key in this.graph.views) {

            if (this.graph.views.hasOwnProperty(key)) {
                var view = this.graph.views[key];

                this.camerasIDs.push(view[1]);

                var newCamera;
                var securityCamera;

                if (view[0] == "perspective") {
                    newCamera = new CGFcamera(view[6] * DEGREE_TO_RAD, view[2], view[3], view[4], view[5]);
                    securityCamera = new CGFcamera(view[6] * DEGREE_TO_RAD, view[2], view[3], view[4], view[5]);
                }
                else if (view[0] == "ortho") {
                    newCamera = new CGFcameraOrtho(view[7], view[8], view[10], view[9], view[2], view[3], view[4], view[5], view[6]);
                    securityCamera = new CGFcameraOrtho(view[7], view[8], view[10], view[9], view[2], view[3], view[4], view[5], view[6]); 
                } 
                    
                this.cameras.push(newCamera);
                this.securityCameras.push(securityCamera);
                
            }
        }

        this.selectedView = this.graph.defaultViewID;
        this.selectedSecurityCamera = this.graph.defaultViewID;

        this.interface.gui.add(this, 'selectedView', this.camerasIDs).name('Selected View').onChange(this.updateActiveCamera.bind(this));
        this.interface.gui.add(this, 'selectedSecurityCamera', this.camerasIDs).name('Selected Security Camera');

        this.interface.setActiveCamera(this.cameras[this.camerasIDs.indexOf(this.graph.defaultViewID)]);
    }
    /**
     * Initializes the scene lights with the values read from the XML file.
     */
    initLights() {
        var i = 0;
        // Lights index.

        // Interface UI to turn on or off each scene light
        var lightsGroup = this.interface.gui.addFolder("Lights (ON/OFF)");
        lightsGroup.open();

        // Reads the lights from the scene graph.
        for (var key in this.graph.lights) {
            if (i >= 8)
                break;              // Only eight lights allowed by WebGL.

            if (this.graph.lights.hasOwnProperty(key)) {
                var light = this.graph.lights[key];

                this.lights[i].setPosition(light[2][0], light[2][1], light[2][2], light[2][3]);
                this.lights[i].setAmbient(light[3][0], light[3][1], light[3][2], light[3][3]);
                this.lights[i].setDiffuse(light[4][0], light[4][1], light[4][2], light[4][3]);
                this.lights[i].setSpecular(light[5][0], light[5][1], light[5][2], light[5][3]);
                this.lights[i].setConstantAttenuation(light[6][0]);
                this.lights[i].setLinearAttenuation(light[6][1]);
                this.lights[i].setQuadraticAttenuation(light[6][2]);

                if (light[1] == "spot") {
                    this.lights[i].setSpotCutOff(light[7]);
                    this.lights[i].setSpotExponent(light[8]);
                    this.lights[i].setSpotDirection(light[9][0]-light[2][0], light[9][1]-light[2][1], light[9][2]-light[2][2]);
                }

                this.lights[i].setVisible(true);
                if (light[0]) 
                    this.lights[i].enable();
                else 
                    this.lights[i].disable();

                this.lights[i].update();

                lightsGroup.add(this.lights[i], 'enabled').name(key);

                i++;
            }

        }
    }

    setDefaultAppearance() {
        this.setAmbient(0.2, 0.4, 0.8, 1.0);
        this.setDiffuse(0.2, 0.4, 0.8, 1.0);
        this.setSpecular(0.2, 0.4, 0.8, 1.0);
        this.setShininess(10.0);
    }
    /** Handler called when the graph is finally loaded. 
     * As loading is asynchronous, this may be called already after the application has started the run loop
     */
    onGraphLoaded() {

        this.axis = new CGFaxis(this, this.graph.referenceLength);

        this.gl.clearColor(this.graph.background[0], this.graph.background[1], this.graph.background[2], this.graph.background[3]);

        this.setGlobalAmbientLight(this.graph.ambient[0], this.graph.ambient[1], this.graph.ambient[2], this.graph.ambient[3]);

        this.initCameras();

        this.initLights();

        this.rttTexture = new CGFtextureRTT(this, this.gl.canvas.width, this.gl.canvas.height);
        this.securityCamera = new MySecurityCamera(this, this.rttTexture);

        this.sceneInited = true;
    }

    /**
     * Updates the active camera of the scene
     */
    updateActiveCamera() {
        this.interface.setActiveCamera(this.cameras[this.camerasIDs.indexOf(this.selectedView)]);
    }

    /**
     * Function called every x seconds, being x the set update period in the constructor
     * @argument t acumulated time
     */
    update(t) {

        if (this.gui.isKeyPressed("KeyM")) {
            this.graph.updateActiveMaterials();
        }

        var deltaT = t - this.last;
        this.last = t;

        if (this.sceneInited) {
            this.graph.updateAnimations(deltaT);
            this.securityCamera.updateTextureTime(t);
        }

    }

    /**
     * Renders the scene to the camera received in its argument
     * @argument camera The camera trough which the scene is going to be rendered
     */
    render(camera) {
        // ---- BEGIN Background, camera and axis setup

        this.camera = camera;

        // Clear image and depth buffer everytime we update the scene
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.pushMatrix();

        if (this.sceneInited) {

            // Initialize Model-View matrix as identity (no transformation)
            this.updateProjectionMatrix();
            this.loadIdentity();

            // Apply transformations corresponding to the camera position relative to the origin
            this.applyViewMatrix();

            // Updating of lights so that switching ON/OFF works
            for (var i = 0; i < this.lights.length; i++) 
                this.lights[i].update();              
            
            this.axis.display();

            // Displays the scene (MySceneGraph function).
            this.graph.displayScene();
        }

        this.popMatrix();
        // ---- END Background, camera and axis setup
    }

    /**
     * Displays the scene, rendering it two times. One for the main camera, and the second for the security camera
     */
    display() {

        if (this.sceneInited) {

            // Render scene to security camera
            this.securityCamera.attachFrameBuffer();
            this.render(this.securityCameras[this.camerasIDs.indexOf(this.selectedSecurityCamera)]);
            this.securityCamera.detachFrameBuffer();

            // Render scene to main camera
            this.render(this.cameras[this.camerasIDs.indexOf(this.selectedView)]);

            // Display security camera on bottom right corner of screen
            this.gl.disable(this.gl.DEPTH_TEST);
            this.securityCamera.display();
            this.gl.enable(this.gl.DEPTH_TEST);
        }
    }


}