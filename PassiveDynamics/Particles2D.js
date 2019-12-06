function Particles() {
    let glcanvas = document.getElementById("MainGLCanvas");
    this.glcanvas = glcanvas;
    glcanvas.addEventListener("contextmenu", function(e){ e.stopPropagation(); e.preventDefault(); return false; }); //Need this to disable the menu that pops up on right clicking

    try {
        glcanvas.gl = glcanvas.getContext("webgl");
        glcanvas.gl.viewportWidth = glcanvas.width;
        glcanvas.gl.viewportHeight = glcanvas.height;
    } catch (e) {
        console.log(e);
    }
    let gl = glcanvas.gl;
    let shader = getShaderProgram(gl, "particles");
    this.shader = shader;
    shader.uTimeUniform = gl.getUniformLocation(shader, "uTime");
    shader.uRadiusUniform = gl.getUniformLocation(shader, "uRadius");
    positionLocation = gl.getAttribLocation(shader, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    

    // Initialize a shader that draws two triangles to cover
    // the viewing area
    const positionBuffer = gl.createBuffer();
    const positions = new Float32Array([-1.0,  1.0,
                                        1.0,  1.0,
                                        -1.0, -1.0,
                                        1.0, -1.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Setup 2 triangles connecting the vertices so that there
    // are solid shaded regions
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    const tris = new Uint16Array([0, 1, 2, 1, 2, 3]);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tris, gl.STATIC_DRAW);
    indexBuffer.itemSize = 1;
    indexBuffer.numItems = 6;

    // Setup uniforms that will change at each frame
    this.time = 0.0;
    this.radius = 0.2;
    this.lastTime = (new Date()).getTime();

    this.repaint = function() {
        let shader = this.shader;
        glcanvas.gl.useProgram(shader);

        // Step 1: Setup uniform variables that are sent to the shaders
        let thisTime = (new Date()).getTime();
        this.time += (thisTime - this.lastTime)/1000.0;
        this.lastTime = thisTime;
        gl.uniform1f(shader.uTimeUniform, this.time);
        gl.uniform1f(shader.uRadiusUniform, this.radius);

        // Step 2: Bind vertex and index buffers to draw two triangles
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

        // Step 3: Keep the animation loop going
        requestAnimationFrame(render);
    }
}
