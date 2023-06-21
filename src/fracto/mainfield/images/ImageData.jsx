import network from "common/config/network.json";

export class ImageData {

   static flickr_access = (cb) => {
      const url = `${network.image_server_url}/access`
      fetch(url)
         .then(response => response.text())
         .then((str) => {
            const access_keys = JSON.parse(str)
            console.log("access_keys", access_keys)
            cb(access_keys)
         })
   }

   static flickr_upload = (img_data, filename, cb) => {
      const url = `${network.image_server_url}/upload`
      fetch(url, {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({file: img_data, name: filename}),
      })
         .then(response => response.text())
         .then((str) => {
            const response = JSON.parse(str)
            console.log("response", response)
            cb(response)
         })
   }

   static flickr_image_sizes = (photo_id, cb) => {
      const url = `${network.image_server_url}/image_sizes?photo_id=${photo_id}`
      fetch(url)
         .then(response => response.text())
         .then((str) => {
            const image_sizes = JSON.parse(str)
            console.log("image_sizes", image_sizes)
            cb(image_sizes)
         })
   }

}

export default ImageData;
