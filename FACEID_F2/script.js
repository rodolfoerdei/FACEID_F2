



const imageUpload = document.getElementById('imageUpload');

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start);

async function start() {

    const firebaseConfig = {
        apiKey: "AIzaSyCXlREk0UNptt-I7m-lsCzb-RzmTaOWrIo",
        authDomain: "tag-f2.firebaseapp.com",
        databaseURL: "https://tag-f2-default-rtdb.firebaseio.com",
        projectId: "tag-f2",
        storageBucket: "tag-f2.appspot.com",
        messagingSenderId: "333008881455",
        appId: "1:333008881455:web:6b2da1063a9e34631e83da",
        measurementId: "G-NKTFDD4H0V"
    };


    // Inicializa o Firebase
    firebase.initializeApp(firebaseConfig);


    const container = document.createElement('div');
    container.style.position = 'relative';
    document.body.append(container);
    const labeledFaceDescriptors = await loadLabeledImages();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
    let image;
    let canvas;
    document.body.append('Loaded');
    imageUpload.addEventListener('change', async () => {
        if (image) image.remove();
        if (canvas) canvas.remove();
        image = await faceapi.bufferToImage(imageUpload.files[0]);
        container.append(image);
        canvas = faceapi.createCanvasFromMedia(image);
        container.append(canvas);
        const displaySize = { width: image.width, height: image.height };
        faceapi.matchDimensions(canvas, displaySize);
        const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
            drawBox.draw(canvas);
        });
    });
}

async function loadLabeledImages() {
    const labels = ['Rebeca', 'Rodolfo'];
    const labeledFaceDescriptors = [];

    for (const label of labels) {
        const descriptions = [];
        for (let i = 1; i <= 2; i++) {
            const imagePath = `user_photos/${label}/${i}.jpg`; // Caminho da imagem no Firebase Storage
            const imgRef = firebase.storage().ref().child(imagePath); // Referência para a imagem no Firebase Storage
            const imgURL = await imgRef.getDownloadURL(); // URL da imagem no Firebase Storage
            const img = await faceapi.fetchImage(imgURL); // Carrega a imagem usando a URL do Firebase Storage
            const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
            descriptions.push(detections.descriptor);
        }
        const labeledFaceDescriptor = new faceapi.LabeledFaceDescriptors(label, descriptions);
        labeledFaceDescriptors.push(labeledFaceDescriptor);
    }

    return labeledFaceDescriptors;
}
