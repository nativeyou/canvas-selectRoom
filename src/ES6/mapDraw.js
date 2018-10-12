(function (canvas_ui, $) {
    var CanvasMap = canvas_ui.Map = function CanvasMap(options) {
        this.offsetX = options.offsetX || 0;
        this.offsetY = options.offsetY || 0;
        this.scaleFactor = options.scaleFactor || 1;
        this.image = options.image;
        this.newWidth = options.newWidth || 0;
        this.newHeight = options.newHeight || 0;
        this.currentFloors = options.currentFloors || 0;
        this.resData = options.resData;

        this.floorWidth = 0;
        this.floorHeight = 0;
        this.northEast = {};
        this.southWest = {};

        this.isIn = false;
        this.currentSelectRoom = -1;
        this.selectRoomIndex = -1;
    }

    CanvasMap.prototype.getPoints = function (room) {
        var pointsList = [],
            _this = this;
        $.each(room.LatLngBounds, function (index, item) {
            var latLong = _this.northEast.Lat - _this.southWest.Lat;
            var lngLong = _this.northEast.Lng - _this.southWest.Lng;
            var x = (item.Lng - _this.southWest.Lng) / lngLong * _this.floorWidth;
            var y = _this.floorHeight - (item.Lat - _this.southWest.Lat) / latLong * _this.floorHeight;
            pointsList.push({
                x: x,
                y: y
            });
        });
        return pointsList;
    };

    CanvasMap.prototype.drawImage = function (context) {
        var width = this.image.width,
            height = this.image.height;
        if (width > height) {
            this.scaleFactor = width / height;
            this.floorHeight = this.newWidth * this.scaleFactor;
            this.floorWidth = this.newWidth;
        } else {
            this.scaleFactor = height / width;
            this.floorHeight = this.newWidth * this.scaleFactor;
            this.floorWidth = this.newWidth;
        }

        // ------ 绘制图片
        context.save();
        context.drawImage(this.image, this.offsetX, this.offsetY, this.newWidth, this.newWidth * this.scaleFactor);
        context.restore();
        // ------
    };

    CanvasMap.prototype.drawItem = function (context, roomPoints, currentRoomIndex, item) {
        var _this = this,
            points = _this.getPoints(roomPoints);
        context.save();
        context.beginPath();
        if (_this.selectRoomIndex === currentRoomIndex) {
            _this.currentSelectRoom = currentRoomIndex;
            context.fillStyle = '#70ad29cc';
            context.strokeStyle = '#70ad29';
        } else {
            context.fillStyle = 'rgba(34, 109, 221, .3)';
            context.strokeStyle = 'rgba(34, 109, 221, 1)';
        }
        for (var i = 0; i < points.length; i++) {
            if (i === 0) {
                context.moveTo(_this.offsetX + points[i].x, _this.offsetY + points[i].y);
            } else {
                context.lineTo(_this.offsetX + points[i].x, _this.offsetY + points[i].y);
            }
        }
        context.closePath();
        context.fill();
        context.stroke();
        context.restore();
    }

    // 绘制房间
    CanvasMap.prototype.drawRoom = function (context, rooms) {
        var _this = this;
        $.each(rooms.Rooms, function (index, item) {
            _this.drawItem(context, item, index);
        });
    }

    CanvasMap.prototype.drawRooms = function (context) {
        var halls = this.resData.Halls;
        for (var i = 0; i < halls.length; i++) {
            var floors = halls[i];
            for (var j = 0; j < halls[i].Floors.length; j++) {
                if (this.currentFloors === parseInt(halls[i].Floors[j].FloorID, 10)) {
                    this.northEast = halls[i].Floors[j].LatLngBounds[1];
                    this.southWest = halls[i].Floors[j].LatLngBounds[0];
                    this.drawRoom(context, halls[i].Floors[j]);
                }
            }
        }
    }

    // 绘制地图
    CanvasMap.prototype.drawMap = function (context) {
        // 清空画布
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        this.drawImage(context);
        this.drawRooms(context);
    };

    // 获取点击
    CanvasMap.prototype.windowToCanvas = function (canvas, e) {
        var boundingReact = canvas.getBoundingClientRect(),
            x = e.clientX || e.changedTouches[0].clientX,
            y = e.clientY || e.changedTouches[0].clientY;
        return {
            x: x - boundingReact.left * (canvas.width / boundingReact.width),
            y: y - boundingReact.top * (canvas.height / boundingReact.height)
        }
    };

    CanvasMap.prototype.render = function (canvas, context) {
        var _this = this;
        this.drawMap(context);

        ['click'].forEach(function (event) {
            canvas.addEventListener(event, function (e) {
                var pointTarget = _this.windowToCanvas(canvas, e);

                var halls = _this.resData.Halls;
                for (var i = 0; i < halls.length; i++) {
                    var floors = halls[i];
                    for (var j = 0; j < halls[i].Floors.length; j++) {
                        if (_this.currentFloors === parseInt(halls[i].Floors[j].FloorID, 10)) {
                            $.each(halls[i].Floors[j].Rooms, function (index, item) {
                                var points = _this.getPoints(item);
                                context.beginPath();
                                for (var i = 0; i < points.length; i++) {
                                    if (i === 0) {
                                        context.moveTo(_this.offsetX + points[i].x, _this.offsetY + points[i].y);
                                    } else {
                                        context.lineTo(_this.offsetX + points[i].x, _this.offsetY + points[i].y);
                                    }
                                }
                                context.closePath();
                                if (context.isPointInPath(pointTarget.x, pointTarget.y)) {
                                    _this.selectRoomIndex = index;
                                    _this.isIn = true;
                                    if (_this.selectRoomIndex != _this.currentSelectRoom) {
                                        _this.drawMap(context);
                                    }
                                } else {
                                    _this.isIn = false;
                                }
                            });
                        }
                    }
                }
            });
        });
    };
})(this.canvas_ui = this.canvas_ui || {}, jQuery);