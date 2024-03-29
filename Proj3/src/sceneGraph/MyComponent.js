/**
 * MyComponent
 * @constructor
 * @param transfMatrix - Transformation Matrix
 * @param animationID - ID of animation for the component
 * @param materials - Array with the list of materials
 * @param texture - Array with texture ID, length s and length t
 * @param componentChildren - Array with the list of children that are components
 * @param primitiveChildren - Array with the list of children that are primitives
 */
class MyComponent {
    constructor(transfMatrix, materials, texture, componentChildren, primitiveChildren) {

        this.transfMatrix = transfMatrix;
        this.materials = materials;
        this.texture = texture;
        this.componentChildren = componentChildren;
        this.primitiveChildren = primitiveChildren;
        this.activeMaterial = 0;
    }

    /**
    * Updates the current active material of this component object
    */
    updateActiveMaterial() {
        this.activeMaterial++;

        if (this.activeMaterial == this.materials.length) 
            this.activeMaterial = 0;
    }
}