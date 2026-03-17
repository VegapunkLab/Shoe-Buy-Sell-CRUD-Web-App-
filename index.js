const express=require("express");
const app=express();
const path=require('path');
const mongoose =require('mongoose');
const methodOverride=require('method-override')
const multer = require('multer');
const Product=require('./models/product');

// --- Multer config ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');           // save to /uploads folder
    },
    filename: function (req, file, cb) {
        // e.g. "image-1710000000000.jpg"  (unique name using timestamp)
        const uniqueName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const upload = multer({ storage: storage });

// Use upload.fields() instead of upload.single() — handles main image + 4 extra
const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'extraImages', maxCount: 4 }
]);


mongoose.connect('mongodb://127.0.0.1:27017/farmStand')
.then(()=>{
console.log("mongo connection opened");
})
.catch(err => {
    console.log("OH NO mongo connection ERROR!!!")
console.log(err);
})

app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'))

// Serve the uploads folder as static so images can be displayed in browser
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/products', async (req, res) => {
    const { category } = req.query;
    if (category && category !== 'all') {
        const products = await Product.find({ category: category });
        res.render('products/index', { products, category });
    } else {
        const products = await Product.find({});
        res.render('products/index', { products, category: 'all' });
    }
});

app.get('/products/new',(req,res) => {
    res.render('products/new')
})

app.post('/products', uploadFields, async (req, res) => {
    const newProduct = new Product(req.body);
    if (req.files['image']) {
        newProduct.image = req.files['image'][0].filename;
    }
    if (req.files['extraImages']) {
        newProduct.extraImages = req.files['extraImages'].map(f => f.filename);
    }
    await newProduct.save();
    res.redirect(`/products/${newProduct._id}`);
});

app.get('/products/:id', async (req,res) =>{
    const {id}= req.params;
    const product = await Product.findById(id)
res.render('products/show',{product})
})

app.get('/products/:id/edit',async (req,res) => {
    const {id}= req.params;
    const product=await Product.findById(id)
    res.render('products/edit',{product})
})

app.put('/products/:id', uploadFields, async (req, res) => {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { runValidators: true, new: true });
    if (req.files['image']) {
        product.image = req.files['image'][0].filename;
    }
    if (req.files['extraImages']) {
        product.extraImages = req.files['extraImages'].map(f => f.filename);
    }
    await product.save();
    res.redirect(`/products/${product._id}`);
});

app.delete('/products/:id', async(req,res) =>{
    const {id}=req.params;
const deletedProduct = await Product.findByIdAndDelete(id);
res.redirect('/products');
})

app.listen(3000,() => {
    console.log("LISTENING ON PORT 3000!");
})


