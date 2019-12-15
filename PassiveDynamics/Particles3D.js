/**
 * Build a class on top of the scene canvas that animates
 * world objects by changing their transformation matrix
 */

vec3 = glMatrix.vec3;
vec4 = glMatrix.vec4;
mat4 = glMatrix.mat4;
quat = glMatrix.quat;

const KEY_W = 87;
const KEY_S = 83;
const KEY_A = 65;
const KEY_D = 68;
const KEY_C = 67;

const KEY_R = 82;
const KEY_E = 69;
const KEY_SPACE = 16;

/**
 * Update the glMatrix transform field of a shape based on 
 * bullet's internal transformation state
 * 
 * @param {object} shape An object containing the fields "ptransform" and "scale"
 */
function updateTransformation(shape) {
    //Scale, rotate, and translate the shape appropriately (in that order)
    let trans = shape.ptransform;
    let x = trans.getOrigin().x();
    let y = trans.getOrigin().y();
    let z = trans.getOrigin().z();
    shape.pos = [x, y, z];
    let q = trans.getRotation();
    // Translation matrix
    let TR = mat4.create();
    mat4.translate(TR, TR, [x, y, z]);
    // Rotation matrix
    let quatMat = mat4.create();
    mat4.fromQuat(quatMat, [q.x(), q.y(), q.z(), q.w()]);
    mat4.multiply(TR, TR, quatMat);
    // Scale matrix
    let SMat = mat4.create();
    mat4.identity(SMat);
    mat4.scale(SMat, SMat, shape.scale);
    mat4.multiply(TR, TR, SMat);
    shape.transform = TR;
}

function Particles() {
    // Step 1: Initialize scene for rendering
    this.scene = {"children":[],
                "cameras":[
                {
                    "pos": [0.00, 1.50, 5.00],
                    "rot": [0.00, 0.00, 0.00, 1.00],
                    "fovy": 1.0
                }],
                "lights":[
                    // {
                    //     "pos":[0, 5, 0],
                    //     "color":[1, 1, 1]
                    // }
                ],
                "materials":{
                    "redambient":{
                        "ka":[0.7, 0.0, 0.0],
                        "kd":[1, 1, 1]
                    },
                    "redish":{
                        "ka":[0.7, 0.0, 0.0],
                    },
                    "blueambient":{
                        "ka":[0.0, 0.0, 0.7],
                        "kd":[0.7, 0.7, 0.7]
                    },
                    "green":{
                        "kd":[0.0, 0.7, 0.0]
                    },
                    "white":{
                        "ka":[1, 1, 1],
                        "kd":[1, 1, 1]
                    },
                    "ground":{
                        "ka":[0.1, 0.1, 0.1],
                        "kd":[1, 1, 1]
                    },
                    "unique":{
                        "ka":[0.2, 0.1, 0.1]
                    },
                    "newunique":{
                        "ka":[0.1, 0.1, 0.1]
                    },
                    "gun":{
                        "ka":[0.1, 0.1, 0.1],
                        "kd":[0.5, 0.7, 0.9]
                    },
                    "goldish":{
                        //"ka":[1.0, 1.0, 0.75],
                        "ka":[0.4, 0.3, 0.0]
                    },
                    "rust":{
                        //"ka":[1.0, 1.0, 0.75],
                        "ka":[0.9, 0.8, 0.7]
                    }
                }          
    };

    this.glcanvas = null;
    this.setglcanvas = function(glcanvas) {
        this.glcanvas = glcanvas;
    }

    // Step 2: Initialize physics engine
    // Collision configuration contains default setup for memory, collisions setup
    let collisionConfig = new Ammo.btDefaultCollisionConfiguration(); 
    // Use the default collision dispatcher.  For parallel processing you can use
    // a different dispatcher (see Extras/BulletMultiThread)
    let dispatcher = new Ammo.btCollisionDispatcher(collisionConfig);
    // btDbvtBroadphase is a good general purpose broadphase.  You can also try out
    // btAxis3Sweep
    let overlappingPairCache = new Ammo.btDbvtBroadphase();
    // The default constraint solver.  For parallel processing you can use a different
    // solver (see Extras/BulletMultiThreaded)
    let solver = new Ammo.btSequentialImpulseConstraintSolver();
    let dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfig);
    dynamicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
    this.dynamicsWorld = dynamicsWorld;

    /**
     * Add a box to the scene by both creating an entry in the scene graph
     * and initializing information for the physics engine
     * 
     * @param {vec3} pos Initial position of the center of the box 
     * @param {vec3} scale Dimensions of the box along each axis
     * @param {vec3} velocity Initial velocity of the box
     * @param {float} mass Mass of the box.  If it is set to 0, it is assumed
     *                     that the box is static and has infinite inertia
     * @param {float} restitution Coefficient of restitution (between 0 and 1)
     * @param {string} material Material to use
     * @param {quat4} rotation The initial rotation
     * @param {boolean} isHidden If true, only add the object to the physics engine, 
     *                          not to the scene graph
     * 
     * @returns{object} The created box object
     */
    this.addBox = function(pos, scale, velocity, mass, restitution, material, rotation, isHidden) {
        if (material === undefined) {
            material = "default";
        }
        if (rotation === undefined) {
            rotation = [0, 0, 0, 1];
        }
        if (isHidden === undefined) {
            isHidden = false;
        }
        // if (isSpinned === undefined) {
        //     isSpinned = false;
        // }
        // Step 1: Setup scene graph entry for rendering
        let box = {
            "scale":scale,
            "pos":pos,
            "velocity":velocity,
            "mass":mass,
            "transform":[scale[0], 0, 0, pos[0], 
                         0, scale[1], 0, pos[1],
                         0, 0, scale[2], pos[2],
                         0, 0, 0, 1],
            "shapes":[
                {
                "type":"box",
                "material":material,
                "hidden":isHidden
                //"filename": "../ggslac/scenes/boxes.json"
                }
                // "type": "scene",
                // "filename": "../ggslac/scenes/boxes.json",
                // "material": material,
                // "hidden": isHidden}
            ]
        }
        this.scene.children.push(box);
        // box.isSpinned = isSpinned;

        // if (isSpinned)
        // {
        const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(scale[0]/2, scale[1]/2, scale[2]/2));
        const ptransform = new Ammo.btTransform();
        ptransform.setIdentity();
        ptransform.setOrigin(new Ammo.btVector3(pos[0], pos[1], pos[2]));	
        ptransform.setRotation(new Ammo.btQuaternion(rotation[0], rotation[1], rotation[2], rotation[3]));
        box.ptransform = ptransform; 
        updateTransformation(box);
        const isDynamic = (mass != 0);
        let localInertia = null;
        if (isDynamic) {
            localInertia = new Ammo.btVector3(velocity[0], velocity[1], velocity[2]);
            boxShape.calculateLocalInertia(mass,localInertia);
        }
        else {
            localInertia = new Ammo.btVector3(0, 0, 0);
        }
        let motionState = new Ammo.btDefaultMotionState(ptransform);
        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, boxShape, localInertia);
        // The final rigid body object
        box.body = new Ammo.btRigidBody(rbInfo);
        box.body.setRestitution(restitution);
        // Finally, add the rigid body to the simulator
        this.dynamicsWorld.addRigidBody(box.body);
        box.physicsActive = true;
    //}
        return box;
    }

    this.addNewBox = function(pos, scale, velocity, mass, restitution, material, isSpinned, movable, physicsActive, rotation, isHidden) {
        if (material === undefined) {
            material = "default";
        }
        if (rotation === undefined) {
            rotation = [0, 0, 0, 1];
        }
        if (isHidden === undefined) {
            isHidden = false;
        }
        if (isSpinned === undefined) {
            isSpinned = false;
        }
        if (physicsActive === undefined) {
            physicsActive = true;
        }
        if (movable === undefined) {
            movable = true;
        }
        // Step 1: Setup scene graph entry for rendering
        let box = {
            "scale":scale,
            "pos":pos,
            "velocity":velocity,
            "mass":mass,
            "transform":[scale[0], 0, 0, pos[0], 
                         0, scale[1], 0, pos[1],
                         0, 0, scale[2], pos[2],
                         0, 0, 0, 1],
            "shapes":[
                {
                "type":"box",
                "material":material,
                "hidden":isHidden
                //"filename": "../ggslac/scenes/boxes.json"
                }
                // "type": "scene",
                // "filename": "../ggslac/scenes/boxes.json",
                // "material": material,
                // "hidden": isHidden}
            ]
        }
        this.scene.children.push(box);
        box.isSpinned = isSpinned;
        box.physicsActive = physicsActive;
        box.movable = movable;

        if (physicsActive)
        {
            const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(scale[0]/2, scale[1]/2, scale[2]/2));
            const ptransform = new Ammo.btTransform();
            ptransform.setIdentity();
            ptransform.setOrigin(new Ammo.btVector3(pos[0], pos[1], pos[2]));	
            ptransform.setRotation(new Ammo.btQuaternion(rotation[0], rotation[1], rotation[2], rotation[3]));
            box.ptransform = ptransform; 
            updateTransformation(box);
            const isDynamic = (mass != 0);
            let localInertia = null;
            if (isDynamic) {
                localInertia = new Ammo.btVector3(velocity[0], velocity[1], velocity[2]);
                boxShape.calculateLocalInertia(mass,localInertia);
            }
            else {
                localInertia = new Ammo.btVector3(0, 0, 0);
            }
            let motionState = new Ammo.btDefaultMotionState(ptransform);
            let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, boxShape, localInertia);
            // The final rigid body object
            box.body = new Ammo.btRigidBody(rbInfo);
            box.body.setRestitution(restitution);
            // Finally, add the rigid body to the simulator
            this.dynamicsWorld.addRigidBody(box.body);
            box.physicsActive = true;
        }
        return box;
    }

    /**
     * Add a sphere to the scene by both creating an entry in the scene graph
     * and initializing information for the physics engine
     * 
     * @param {vec3} pos Initial position of the center of the sphere 
     * @param {float} radius Radius of the sphere
     * @param {vec3} velocity Initial velocity of the sphere
     * @param {float} mass Mass of the sphere
     * @param {float} restitution Coefficient of restitution (between 0 and 1)
     * @param {string} material Material to use
     * @param {boolean} isLight Should it also be emitting light?
     * @param {boolean} isHidden If true, only add the object to the physics engine, 
     *                          not to the scene graph
     * @param {boolean} physicsActive True by default.  If false, ignore all physics and simply render
     * 
     * @returns {object} The created sphere object
     */
    this.addSphere = function(pos, radius, velocity, mass, restitution, material, isLight, isHidden, physicsActive, heavy) {
        if (material === undefined) {
            material = "default";
        }
        if (isLight === undefined) {
            isLight = false;
        }
        if (isHidden === undefined) {
            isHidden = false;
        }
        if (physicsActive === undefined) {
            physicsActive = true;
        }
        if (heavy === undefined) {
            heavy = false;
        }

        // Step 1: Setup scene graph entry for rendering
        let sphere = {
            "scale":[radius, radius, radius],
            "pos":pos,
            "radius":radius,
            "velocity":velocity,
            "mass":mass,
            "transform":[1, 0, 0, pos[0], 
                         0, 1, 0, pos[1],
                         0, 0, 1, pos[2],
                         0, 0, 0, 1],
            "shapes":[
                {"type":"sphere",
                "material":material,
                "hidden":isHidden}
            ]
        }
        this.scene.children.push(sphere);
        sphere.isLight = isLight;
        sphere.heavy = heavy;
        if (isLight) {
            // If it is a light, need to also add it to the list of lights
            sphere.color = this.scene.materials[material].kd;
            if (heavy)
            {
                sphere.atten = [9, 0, 0];
            }  
            else
            {
                sphere.atten = [3, 0, 0];
            }
            this.scene.lights.push(sphere);
        }
        
        // Step 2: Setup ammo.js physics engine entry
        sphere.physicsActive = physicsActive;
        if (physicsActive) {
            const colShape = new Ammo.btSphereShape(radius);
            const localInertia = new Ammo.btVector3(velocity[0], velocity[1], velocity[2]);
            colShape.calculateLocalInertia(mass, localInertia);
            // Need to redefine the transformation for the physics engine
            const ptransform = new Ammo.btTransform();
            ptransform.setIdentity();
            ptransform.setOrigin(new Ammo.btVector3(pos[0], pos[1], pos[2]));
            sphere.ptransform = ptransform;
            updateTransformation(sphere);
            const motionState = new Ammo.btDefaultMotionState(ptransform);
            const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
            // The final rigid body object
            sphere.body = new Ammo.btRigidBody(rbInfo); 
            sphere.body.setRestitution(restitution);
            // Finally, add the rigid body to the simulator
            this.dynamicsWorld.addRigidBody(sphere.body);
        }
        return sphere;
    }

    /**
     * Add spheres with a random initial position, radius, initial velocity, mass,
     * and coefficient of restitution
     */
    this.randomlyInitSpheres = function(N) {
        for (let i = 0; i < N; i++) {
            let pos = [Math.random()*10-5, Math.random()*10, Math.random()*10-5];
            let radius = 0.5*Math.random();
            let velocity = [Math.random()*0.1, Math.random()*0.1, Math.random()*0.1];
            const mass = Math.random();
            const restitution = Math.random(); // How bouncy the sphere is (between 0 and 1)
            let physicsActive = Math.random();
            if (physicsActive > 0.5) {
                physicsActive = true;
            }
            else {
                physicsActive = false;
            }
            const isHidden = false;
            if (i < 4) {
                this.addSphere(pos, radius, velocity, mass, restitution, "white", true, isHidden, physicsActive);
            }
            else {
                this.addSphere(pos, radius, velocity, mass, restitution, "redambient", false, isHidden, physicsActive);
            }
        }
    }

    /**
     * Add a mesh to the scene with a random mass, velocity, position
     * 
     * @param {string} filename Path to mesh
     * @param {vec3} pos Initial position of the center of the sphere 
     * @param {vec3} scale How to rescale the mesh along each axis
     * @param {vec3} velocity Initial velocity of the sphere
     * @param {float} mass Mass of the sphere
     * @param {float} restitution Coefficient of restitution (between 0 and 1)
     * @param {string} material Material to use
     * @param {boolean} isLight Should it also be emitting light?
     * * @param {quat4} rotation rotate object
     */
    this.addMesh = function(filename, pos, scale, velocity, mass, restitution, material, isLight, isHidden, rotation, isSpinned, physicsActive, isTank) {
        if (isTank === undefined) {
            isTank = false;
        }
        if (isLight === undefined) {
            isLight = false;
        }
        if (isHidden === undefined) {
            isHidden = false;
        }
        if (rotation === undefined)
        {
            rotation = [0, 0, 0, 1];
        }
        if (isSpinned === undefined)
        {
            isSpinned = false;
        }
        if (physicsActive === undefined) {
            physicsActive = true;
        }
        // Step 1: Setup the convex hull collision shape
        // for the mesh
        mesh = new BasicMesh();
        let lines = BlockLoader.loadTxt(filename);
        let res = loadFileFromLines(lines.split("\n"));
        let vertices = res.vertices;
        let faces = res.faces;
        let btMesh = new Ammo.btTriangleMesh();
        // Copy vertex information over to bullet
        for (let i = 0; i < vertices.length; i++) {
            let v = vertices[i];
            vertices[i] = new Ammo.btVector3(scale[0]*v[0], scale[1]*v[1], scale[2]*v[2]);
        }
        // Copy over face information (assuming triangle mesh)
        for (let i = 0; i < faces.length; i++) {
            let f = faces[i];
            btMesh.addTriangle(vertices[f[0]], vertices[f[1]], vertices[f[2]]);
        }
        let colShape = new Ammo.btConvexTriangleMeshShape(btMesh);
        /*let hull = new Ammo.btShapeHull(colShape);
        let margin = colShape.getMargin();
        hull.buildHull(margin);
        colShape.setUserPointer(hull);*/

        // Step 2: Initialize the scene graph entry
        let shape = {
            "scale":scale,
            "pos":pos,
            "velocity":velocity,
            "mass":mass,
            "transform":[scale[0], 0, 0, pos[0], 
                         0, scale[1], 0, pos[1],
                         0, 0, scale[2], pos[2],
                         0, 0, 0, 1],
            "shapes":[
                {"type":"mesh",
                "filename":filename,
                "material":material,
                "hidden":isHidden}
            ]
        };
        this.scene.children.push(shape);
        
        if (isLight) {
            // If it is a light, need to also add it to the list of lights
            shape.color = this.scene.materials[material].kd;
            shape.atten = [1, 0, 0];
            this.scene.lights.push(shape);
        }
        
        // Step 3: Setup ammo.js physics engine entry
    
        shape.physicsActive = physicsActive;
        shape.isSpinned = isSpinned;
        shape.isTank = isTank;
        
        if (physicsActive)
        {
            const localInertia = new Ammo.btVector3(velocity[0], velocity[1], velocity[2]);
            colShape.calculateLocalInertia(mass, localInertia);
            // Need to redefine the transformation for the physics engine
            const ptransform = new Ammo.btTransform();
            ptransform.setIdentity();
            ptransform.setOrigin(new Ammo.btVector3(pos[0], pos[1], pos[2]));
            ptransform.setRotation(new Ammo.btQuaternion(rotation[0], rotation[1], rotation[2], rotation[3]));
            shape.ptransform = ptransform;
            updateTransformation(shape);
            const motionState = new Ammo.btDefaultMotionState(ptransform);
            const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
            // The final rigid body object
            shape.body = new Ammo.btRigidBody(rbInfo); 
            shape.body.setRestitution(restitution);
            // Finally, add the rigid body to the simulator
            this.dynamicsWorld.addRigidBody(shape.body);
        }
        
        return shape;
    }

    this.addNewMesh = function(filename, pos, scale, velocity, mass, restitution, material, isLight, isHidden, rotation, isSpinned, physicsActive) {
        if (isLight === undefined) {
            isLight = false;
        }
        if (isHidden === undefined) {
            isHidden = false;
        }
        if (rotation === undefined)
        {
            rotation = [0, 0, 0, 1];
        }
        if (isSpinned === undefined)
        {
            isSpinned = false;
        }
        if (physicsActive === undefined) {
            physicsActive = true;
        }
        // Step 1: Setup the convex hull collision shape
        // for the mesh
        mesh = new BasicMesh();
        let lines = BlockLoader.loadTxt(filename);
        let res = loadFileFromLines(lines.split("\n"));
        let vertices = res.vertices;
        let faces = res.faces;
        let btMesh = new Ammo.btTriangleMesh();
        // Copy vertex information over to bullet
        for (let i = 0; i < vertices.length; i++) {
            let v = vertices[i];
            vertices[i] = new Ammo.btVector3(scale[0]*v[0], scale[1]*v[1], scale[2]*v[2]);
        }
        // Copy over face information (assuming triangle mesh)
        for (let i = 0; i < faces.length; i++) {
            let f = faces[i];
            btMesh.addTriangle(vertices[f[0]], vertices[f[1]], vertices[f[2]]);
        }
        let colShape = new Ammo.btConvexTriangleMeshShape(btMesh);
        /*let hull = new Ammo.btShapeHull(colShape);
        let margin = colShape.getMargin();
        hull.buildHull(margin);
        colShape.setUserPointer(hull);*/

        // Step 2: Initialize the scene graph entry
        let shape = {
            "scale":scale,
            "pos":pos,
            "velocity":velocity,
            "mass":mass,
            "transform":[scale[0], 0, 0, pos[0], 
                         0, scale[1], 0, pos[1],
                         0, 0, scale[2], pos[2],
                         0, 0, 0, 1],
            "shapes":[
                {"type":"mesh",
                "filename":filename,
                "material":material,
                "hidden":isHidden}
            ]
        };
        this.scene.children.push(shape);
        
        if (isLight) {
            // If it is a light, need to also add it to the list of lights
            shape.color = this.scene.materials[material].kd;
            shape.atten = [1, 0, 0];
            this.scene.lights.push(shape);
        }
        
        // Step 3: Setup ammo.js physics engine entry
    
        shape.physicsActive = physicsActive;
        //shape.isSpinned = isSpinned;
        
        if (physicsActive)
        {
            const localInertia = new Ammo.btVector3(velocity[0], velocity[1], velocity[2]);
            colShape.calculateLocalInertia(mass, localInertia);
            // Need to redefine the transformation for the physics engine
            const ptransform = new Ammo.btTransform();
            ptransform.setIdentity();
            ptransform.setOrigin(new Ammo.btVector3(pos[0], pos[1], pos[2]));
            ptransform.setRotation(new Ammo.btQuaternion(rotation[0], rotation[1], rotation[2], rotation[3]));
            shape.ptransform = ptransform;
            updateTransformation(shape);
            const motionState = new Ammo.btDefaultMotionState(ptransform);
            const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
            // The final rigid body object
            shape.body = new Ammo.btRigidBody(rbInfo); 
            shape.body.setRestitution(restitution);
            // Finally, add the rigid body to the simulator
            this.dynamicsWorld.addRigidBody(shape.body);
        }
        
        return shape;
    }

    /**
     * Add fences by moving Z axis.
     * 
     * @param {filename} mesh what fence to init
     * @param {vec3} pos the initial possition to start init fences.
     * @param {vec3} scale How to rescale the mesh along each axis
     * @param {int} n number of fences to init
     * @param {int} interval between fences (from center to center btwn fences)
     * @param {float} mass Mass of the sphere
     * @param {quat4} rotation rotate object
     */
    this.initFenceX = function(mesh, pos, scale, n, interval, mass, rotation) {

        for (let i = 1; i <= n; i++)
        {
            pos = [pos[0] + (interval), pos[1], pos[2]];
            this.addMesh(mesh, pos, scale, [0, 0, 0], mass, 0, "goldish", false, false, rotation);
        }
    }

    /**
     * Add fences by moving Z axis.
     * 
     * @param {filename} mesh what fence to init
     * @param {vec3} pos the initial possition to start init fences.
     * @param {vec3} scale How to rescale the mesh along each axis
     * @param {int} n number of fences to init
     * @param {int} interval between fences (from center to center btwn fences)
     * @param {float} mass Mass of the sphere
     * @param {quat4} rotation rotate object
     */
    this.initFenceZ = function(mesh, pos, scale, n, interval, mass, rotation) {

        for (let i = 1; i <= n; i++)
        {
            pos = [pos[0], pos[1], pos[2] + (interval)];
            this.addMesh(mesh, pos, scale, [0, 0, 0], mass, 0, "goldish", false, false, rotation);
        }
    }

    /**
     * Add fences by moving both on X and Z axis.
     * 
     * @param {filename} mesh what fence to init
     * @param {vec3} pos the initial possition to start init fences.
     * @param {vec3} scale How to rescale the mesh along each axis
     * @param {int} n number of fences to init
     * @param {vec3} interval between fences (from center to center btwn fences)
     * @param {float} mass Mass of the sphere
     * @param {quat4} rotation rotate object
     * @param {boolean} negative helps to define the direction to init
     */
    this.initFenceXZ = function(mesh, pos, scale, n, interval, mass, rotation, negative) {
        if (negative === undefined)
        {
            negative = false;
        }

        for (let i = 1; i <= n; i++)
        {
            pos = [pos[0] + (interval[0]), pos[1], pos[2] + (interval[1])];
            this.addMesh(mesh, pos, scale, [0, 0, 0], mass, 0, "goldish", false, false, rotation);
        }
    }

    /**
     * Add light spheres with initial position. All other parameteres also assumed to be predefined.
     * 
     * @param {int} n number of initialized spheres.
     */
    this.initSpheresXZ = function(n) {
        for (i = 0; i < n; i++)
        {
            for (k = 0; k < n; k++)
            {
                this.addSphere([-70+i*3, 0.3, 50+k*3], 0.3, [0, 0, 0], 100, 0.0, "redambient", true, false, true, true);
            }
        }
    }

    /**
     * Add boxes with a random initial position, dimensions, initial velocity, mass,
     * coefficient of restitution, and orientation
     * 
     * @param {int} N number of randomely initialized boxes
     */
    this.randomlyInitBoxes = function(N) {
        for (let i = 0; i < N; i++) {
            let pos = [Math.random()*10-5, Math.random()*10, Math.random()*10-5];
            let scale = [0.5*Math.random(), 0.5*Math.random(), 0.5*Math.random()];
            let velocity = [Math.random()*0.1, Math.random()*0.1, Math.random()*0.1];
            const mass = Math.random();
            const restitution = Math.random();
            let rotation = vec4.create();
            vec4.random(rotation, 1);
            this.addBox(pos, scale, velocity, mass, restitution, "blueambient", rotation);
        }
    }

    /**
     * Add wooden boxes with dimensions, initial velocity, mass,
     * coefficient of restitution, material, and orientation
     *
     * @param {vec3} pos initial position for initializing boxes
     * @param {int} N number of randomely initialized boxes
     */
    this.randomlyInitWoodenBoxes = function(pos, N) {
        for (let i = 0; i < N; i++) {
            pos = [pos[0] + Math.random()*10, pos[1] + Math.random()*20, pos[2] + Math.random()*10];
            let rotation = vec4.create();
            vec4.random(rotation, 1);
            this.addMesh("ggslac/meshes/d/w_box.off", pos, [3, 3, 3], [0, 0, 0], 20, 0, "goldish", false, false, rotation);
        }
    }

    this.addCameraSphere = function() {
        let pos = [Math.random()*10-5, Math.random()*10, Math.random()*10-5];
        let radius = 0.5*Math.random();
        let velocity = [Math.random()*0.1, Math.random()*0.1, Math.random()*0.1];
        const mass = Math.random();
        const restitution = Math.random(); // How bouncy the sphere is (between 0 and 1)
        this.camerasphere = this.addSphere(pos, radius, velocity, mass, restitution, "white");
    }

    this.time = 0.0;
    this.lastTime = (new Date()).getTime();

    /**
     * A helper function to extract vectors from the camera
     */
    this.getCameraVectors = function() {
        let T = vec3.create();
        let R = vec3.create();
        vec3.copy(R, this.glcanvas.camera.right);
        let U = vec3.create();
        vec3.copy(U, this.glcanvas.camera.up);
        vec3.cross(T, U, R);
        //this.glfwSetInputMode(window, this.glcanvas.GLFW_CURSOR, this.glcanvas.GLFW_CURSOR_DISABLED);
        return {'T':T, 'U':U, 'R':R};
    }

    this.keyDown = function(evt) {
        for (key of [KEY_W, KEY_S, KEY_D, KEY_A, KEY_R, KEY_E, KEY_SPACE]) {
            if (evt.keyCode == key) {
                this.keysDown[key] = true;
            }
        }
    }

    this.keyUp = function(evt) {
        for (key of [KEY_W, KEY_S, KEY_D, KEY_A, KEY_R, KEY_E, KEY_SPACE]) {
            if (evt.keyCode == key) {
                this.keysDown[key] = false;
            }
        }
    }  

    this.makeClick = function(evt) {
        let clickType = "LEFT";
        evt.preventDefault();
        if (evt.which) {
            if (evt.which == 3) clickType = "RIGHT";
            if (evt.which == 2) clickType = "MIDDLE";
        }
        else if (evt.button) {
            if (evt.button == 2) clickType = "RIGHT";
            if (evt.button == 4) clickType = "MIDDLE";
        }
        if (clickType == "RIGHT") {
            let pos = vec3.create();
            let res = this.getCameraVectors();
            let T = res['T']; // Towards vector
            let U = res['U']; // Up vector
            vec3.scaleAndAdd(pos, this.glcanvas.camera.pos, U, 0);
            vec3.scaleAndAdd(pos, pos, T, 2);
            let sphere = this.addSphere(pos, 0.2, [0, 0, 0], 1, 0.5, "blueambient");
            // Velocity is 40 units / second in the camera's towards direction
            vec3.scale(T, T, 40); 
            sphere.body.setLinearVelocity(new Ammo.btVector3(T[0], T[1], T[2]));
            this.glcanvas.parseNode(sphere);
        }
    }

    this.setupListeners = function() {
        this.glcanvas.active = false; // Disable default listeners
        this.keysDown = {KEY_W:false, KEY_S:false, KEY_A:false, KEY_D:false, KEY_R:false};
        document.addEventListener('keydown', this.keyDown.bind(this), true);
        document.addEventListener('keyup', this.keyUp.bind(this), true);
        this.glcanvas.addEventListener('mousedown', this.makeClick.bind(this));
        var mouse_monitor = function(e) {
            var x = e.pageX;
            var y = e.pageY;
            // var z = e.pageZ;
            // console.log(x, y, z);
          }
        //this.glcanvas.addEventListener('mousemove', mouse_monitor);
        //this.glcanvas.motion('mousemove', mouse_monitor);
    }
    /**
     * Step forward in time in the physics simulation.
     * Then, for each rigid body object in the scene, read out
     * the current position and orientation from the physics
     * engine, and send it over to the rendering engine (ggslac)
     * via a transformation matrix
     */
    this.animate = function() {
        let thisTime = (new Date()).getTime();
        let dt = (thisTime - this.lastTime)/1000.0; // Change in time in seconds
        this.time += dt;
        this.lastTime = thisTime;
        this.dynamicsWorld.stepSimulation(dt, 10);
        for (shape of this.scene.children) {
            if (shape.physicsActive) {
                if (shape.isTank)
                {
                    let moveZ = 0;
                    moveZ = 22*(Math.cos(this.time*0.9) + Math.sin(this.time*0.9));
                    shape.body.setLinearVelocity(new Ammo.btVector3(0, 0, moveZ));
                }
                if (shape.movable) {
                    // let moveX = 0;
                    // let moveY = 0;
                    let moxeZ = 0;
                    // moveX = 10*(Math.cos(this.time*0.5)+Math.sin(this.time*0.5));
                    // moveY = 10*(Math.cos(this.time*0.5)+Math.sin(this.time*0.5));
                    moveZ = 10*(Math.cos(this.time*0.5)+Math.sin(this.time*0.7));
                    // console.log(Math.cos(this.time*0.5));
                    
                    shape.body.setLinearVelocity(new Ammo.btVector3(0, 0, moveZ));
                }
                let trans = shape.ptransform;
                shape.body.getMotionState().getWorldTransform(trans);
                updateTransformation(shape);
            }
            else {
                if (shape.isLight) {
                    let v = vec3.create();
                    vec3.copy(v, shape.pos);
                    v[0] += 60*Math.cos(this.time);
                    v[2] += 60*Math.sin(this.time);
                    v[1] += 40*Math.cos(this.time);
                    mat4.translate(shape.transform, mat4.create(), v);
                    shape.radius = 20*Math.random();
                    shape.atten = [5, 0, 0];
                }
                else {
                    let mrot = mat4.create();
                    mat4.fromYRotation(mrot, dt*6);
                    mat4.multiply(shape.transform, shape.transform, mrot);
                }
            }
        }
        if (!(this.glcanvas === null)) {
            // Make the camera in world coordinates 4 units in z in front of the cow
            // and 2 units above the cow
            vec3.add(this.glcanvas.camera.pos, this.cow.pos, vec3.fromValues(0, 3, 0));
        }
        if (!(this.keysDown === undefined)) {
            let res = this.getCameraVectors();
            let T = res['T']; // Towards vector
            let R = res['R']; // Right vector
            let U = res['U']; // Right vector
            vec3.scale(T, T, 5);
            vec3.scale(R, R, 5);
            vec3.scale(U, U, 6);
            if (this.keysDown[KEY_W]) {
                // Apply a central impulse in the forward direction of the camera
                this.cow.body.applyCentralImpulse(new Ammo.btVector3(T[0], T[1], T[2]));
            }
            if (this.keysDown[KEY_S]) {
                // Apply a central impulse in the reverse direction of the camera
                vec3.scale(T, T, -1);
                this.cow.body.applyCentralImpulse(new Ammo.btVector3(T[0], T[1], T[2]));
            }
            if (this.keysDown[KEY_D]) {
                // Apply a central impulse in the right direction of the camera
                this.cow.body.applyCentralImpulse(new Ammo.btVector3(R[0], R[1], R[2]));
            }
            if (this.keysDown[KEY_A]) {
                // Apply a central impulse in the left direction of the camera
                vec3.scale(R, R, -1);
                this.cow.body.applyCentralImpulse(new Ammo.btVector3(R[0], R[1], R[2]));
            }
            if (this.keysDown[KEY_R]) {
                // Change camera view to the (0, 25, 0) position.
                vec3.add(this.glcanvas.camera.pos, this.glight.pos, vec3.fromValues(0, 25, 0)); 
            }
            if (this.keysDown[KEY_SPACE]) {
                // Apply a central impulse in the up direction of the camera
                // let U = vec3.create();
                // vec3.cross(U, R, T);
                this.cow.body.applyCentralImpulse(new Ammo.btVector3(U[0], U[1], U[2]));
            }
            if (this.keysDown[KEY_E]) {
                // Change camera view to the (0, 25, 0) position.
                console.log(this.glcanvas.camera.pos);
                vec3.add(this.glcanvas.camera.pos, this.cow.pos, vec3.fromValues(0, 5, 10)); 
                // vec3.rotateY(this.glcanvas.camera.pos, R, T, 10); 
                // this.cow.body.applyCentralImpulse(new Ammo.btVector3(T[0], T[1], T[2]));

                // let mrot = mat4.create();
                // mat4.fromYRotation(mrot, 1);
                // console.log(this.glcanvas.camera.pos);
                // let transform = [1, 0, 0, T, 
                //          0, 1, 0, U,
                //          0, 0, 1, R,
                //          0, 0, 0, 1];
                // mat4.multiply(transform, transform, mrot);
                console.log(this.glcanvas.camera.pos);
            }
        }
    }
}
