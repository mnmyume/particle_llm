uniform ivec2 _uAniTexBoundarySize;
uniform ivec2 _uAniTexCellSize;
uniform float _uAniTexNumFrames;
uniform float _uAniTexFps;

vec4 _GEN_ANI_TEX_UV(sampler2D aniSampler, float aniType, float frame){

    int texWidth = textureSize(aniSampler, 0).x;
    int texHeight = textureSize(aniSampler, 0).y;
    int cellWidth = _uAniTexCellSize.x;
    int cellHeight = _uAniTexCellSize.y;

    float currFrame = aniType * _uAniTexNumFrames + frame;

    float numCols = float(texWidth / cellWidth);
    float numRows = float(texHeight / cellHeight);
    float row = floor(currFrame / numCols);
    float col = mod(currFrame, numCols);
    float uOffset = col/numCols;
    float vOffset = row/numRows;

    return vec4(uOffset, vOffset, numCols, numRows);
}
