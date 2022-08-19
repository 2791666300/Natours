
export const displayMap = (locations) => {
    
    var map = new BMapGL.Map("map");
    // // 创建地图实例 
    var point = new BMapGL.Point(45.59293403932144, -114.6875608299163);
    // // 创建点坐标 
    map.centerAndZoom(point, 15);
}
// // 初始化地图，设置中心点坐标和地图级别  