class Rectangule {
    constructor(x, y, w, h) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
    }

    contains(pointObject) {
        return (
            pointObject.x >= this.x - this.w &&
            pointObject.x <= this.x + this.w &&
            pointObject.y >= this.y - this.h &&
            pointObject.y <= this.y + this.h
        )
    }

    intersects(range) {
        return !(
            range.x - range.w > this.x + this.w ||
            range.x + range.w < this.x - this.w ||
            range.y + range.h < this.y - this.h ||
            range.y - range.h > this.y + this.h
        )
    }
}
    
class PointObject {
    constructor(x, y, source) {
        this.x = x
        this.y = y
        this.source = source
    }
}
  
class QuadTree {
    constructor(boundary, n) {
        this.boundary = boundary
        this.capacity = n
        this.pointObjects = []
        this.divided = false
    }

    subdivide() {
        let x = this.boundary.x
        let y = this.boundary.y
        let w = this.boundary.w
        let h = this.boundary.h

        let nwrect = new Rectangule(x + w/2, y - h/2, w/2, h/2)
        this.nw = new QuadTree(nwrect, this.capacity)

        let nerect = new Rectangule(x - w/2, y - h/2, w/2, h/2)
        this.ne = new QuadTree(nerect, this.capacity)

        let swrect = new Rectangule(x + w/2, y + h/2, w/2, h/2)
        this.sw = new QuadTree(swrect, this.capacity)

        let serect = new Rectangule(x - w/2, y + h/2, w/2, h/2)
        this.se = new QuadTree(serect, this.capacity)

        this.divided = true
    }

    insert(pointObject) {
        if (!this.boundary.contains(pointObject)) {
            return false
        }

        if (this.pointObjects.length < this.capacity) {
            this.pointObjects.push(pointObject)
            return true
        } else {
            if (!this.divided) {
                this.subdivide()
            }

            if (this.nw.insert(pointObject)) {
                return true
            }
            if (this.ne.insert(pointObject)) {
                return true
            }
            if (this.sw.insert(pointObject)) {
                return true
            }
            if (this.se.insert(pointObject)) {
                return true
            }
        }
    }

    verifyDivision() {
        if ((!this.nw.divided && this.nw.pointObjects.length == 0 )&&
        (!this.ne.divided && this.ne.pointObjects.length == 0 ) &&
        (!this.sw.divided && this.sw.pointObjects.length == 0 ) &&
        (!this.se.divided && this.se.pointObjects.length == 0 )) {
            delete this.nw
            delete this.ne
            delete this.sw
            delete this.se

            this.divided = false
        }
    }

    delete(pointObject) {
        if (!this.boundary.contains(pointObject)) {
            return false
        }

        let pointIndex = this.pointObjects.findIndex((element) => {
            if (element && element.x == pointObject.x &&
                element.y == pointObject.y &&
                element.source.id == pointObject.source.id) {
                    return true
            } else { return false }
        })
        
        if (pointIndex >= 0) {
            this.pointObjects.splice(pointIndex, 1)
            
            return true
        } else {
            let excluido = false
            if (this.nw.delete(pointObject)) {
                excluido = true
            }
            if (this.ne.delete(pointObject)) {
                excluido = true
            }
            if (this.sw.delete(pointObject)) {
                excluido = true
            }
            if (this.se.delete(pointObject)) {
                excluido = true
            }

            if (this.divided) {
                this.verifyDivision()
            }

            return excluido
        }
    }

    query(range) {
        let found = []
        if (!this.boundary.intersects(range)) {
            return found
        } else {
            for (let p of this.pointObjects) {
                if (range.contains(p)) {
                    found.push(p);
                }
            }

            if (this.divided) {
                found = found.concat(this.nw.query(range))
                found = found.concat(this.ne.query(range))
                found = found.concat(this.sw.query(range))
                found = found.concat(this.se.query(range))
            }

            return found
        }
    }
}
    
module.exports = {
    PointObject,
    Rectangule,
    QuadTree
}
// class QuadTree {
//     constructor(boundary, n) {
//         this.boundary = boundary
//         this.capacity = n
//         this.pointObjects = []
//         this.divided = false
//     }

//     subdivide() {
//         let x = this.boundary.x
//         let y = this.boundary.y
//         let w = this.boundary.w
//         let h = this.boundary.h

//         let nwrect = new Rectangule(x + w/2, y - h/2, w/2, h/2)
//         this.nw = new QuadTree(nwrect, this.capacity)

//         let nerect = new Rectangule(x - w/2, y - h/2, w/2, h/2)
//         this.ne = new QuadTree(nerect, this.capacity)

//         let swrect = new Rectangule(x + w/2, y + h/2, w/2, h/2)
//         this.sw = new QuadTree(swrect, this.capacity)

//         let serect = new Rectangule(x - w/2, y + h/2, w/2, h/2)
//         this.se = new QuadTree(serect, this.capacity)

//         this.divided = true
//     }

//     insert(pointObject) {
//         if (!this.boundary.contains(pointObject)) {
//             return false
//         }

//         if (this.pointObjects.length < this.capacity) {
//             this.pointObjects.push(pointObject)
//             return true
//         } else {
//             if (!this.divided) {
//                 this.subdivide()
//             }

//             if (this.nw.insert(pointObject)) {
//                 return true
//             }
//             if (this.ne.insert(pointObject)) {
//                 return true
//             }
//             if (this.sw.insert(pointObject)) {
//                 return true
//             }
//             if (this.se.insert(pointObject)) {
//                 return true
//             }
//         }
//     }

//     verifyDivision() {
//         if (this.nw.pointObjects.length == 0 ||
//           this.ne.pointObjects.length == 0 ||
//           this.sw.pointObjects.length == 0 ||
//           this.se.pointObjects.length == 0) {
//             delete this.nw
//             delete this.ne
//             delete this.sw
//             delete this.se

//             this.divided = false
//         }
//     }

//     delete(pointObject) {
//         if (!this.boundary.contains(pointObject)) {
//             return false
//         }

//         let pointIndex = this.pointObjects.findIndex((element) => {
//             if (element && element.x == pointObject.x &&
//                 element.y == pointObject.y &&
//                 element.source.id == pointObject.source.id) {
//                     return true
//             } else { return false }
//         })
        
//         if (pointIndex >= 0) {
//             delete this.pointObjects[pointIndex]
            
//             return true
//         } else {
//             if (this.nw.delete(pointObject)) {
//                 return true
//             }
//             if (this.ne.delete(pointObject)) {
//                 return true
//             }
//             if (this.sw.delete(pointObject)) {
//                 return true
//             }
//             if (this.se.delete(pointObject)) {
//                 return true
//             }

//             if (this.divided) {
//                 this.verifyDivision()
//             }
//         }
//     }

//     update(pointObjectOld, pointObjectNew) {
//         this.delete(pointObjectOld)
//         this.insert(pointObjectNew)
//     }
// }