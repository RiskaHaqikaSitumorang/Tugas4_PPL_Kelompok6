"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const port = 4000;
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
// Function to read comics data from comics.json
function readComicsData() {
    try {
        const data = fs_1.default.readFileSync(path_1.default.join(__dirname, 'comics.json'), 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error('Error reading comics.json:', error.message);
        return { comics: [] };
    }
}
// Function to write comics data to comics.json
function writeComicsData(data) {
    try {
        fs_1.default.writeFileSync(path_1.default.join(__dirname, 'comics.json'), JSON.stringify(data, null, 2), 'utf8');
        return true;
    }
    catch (error) {
        console.error('Error writing to comics.json:', error.message);
        return false;
    }
}
// Serve the main page with UI
app.get('/', (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
// Basic route to check if the server is running
app.get('/api', (_req, res) => {
    res.send('Welcome to Comic API!');
});
// GET all comics
app.get('/api/comics', (_req, res) => {
    const data = readComicsData();
    res.json({
        message: 'Successfully retrieved all comics',
        data: data.comics,
    });
});
// GET single comic by ID
app.get('/api/comics/:id', (req, res) => {
    const data = readComicsData();
    const comic = data.comics.find((c) => c.id === parseInt(req.params.id));
    if (!comic) {
        res.status(404).json({ message: 'Comic not found' });
        return;
    }
    res.json({
        message: 'Successfully retrieved comic details',
        data: comic,
    });
});
// Search comics with filters
app.get('/api/comics/search', (req, res) => {
    const { title, author, publisher, genre, status } = req.query;
    const data = readComicsData();
    let results = [...data.comics];
    // Apply filters
    if (title) {
        results = results.filter((c) => c.title.toLowerCase().includes(title.toLowerCase()));
    }
    if (author) {
        results = results.filter((c) => c.author.toLowerCase().includes(author.toLowerCase()));
    }
    if (publisher) {
        results = results.filter((c) => c.publisher.toLowerCase().includes(publisher.toLowerCase()));
    }
    if (genre) {
        results = results.filter((c) => c.genre.toLowerCase().includes(genre.toLowerCase()));
    }
    if (status) {
        results = results.filter((c) => c.status.toLowerCase() === status.toLowerCase());
    }
    if (results.length === 0) {
        res.status(404).json({ message: 'No comics match the search criteria' });
        return;
    }
    res.json({
        message: 'Comic search results',
        count: results.length,
        data: results,
    });
});
// POST new comic
app.post('/api/comics', (req, res) => {
    const { title, author, publisher, genre, releaseYear, volumes, status, } = req.body;
    // Validation
    if (!title || !author) {
        res.status(400).json({ message: 'Title and author are required' });
        return;
    }
    const data = readComicsData();
    const newComic = {
        id: data.comics.length > 0
            ? Math.max(...data.comics.map((c) => c.id)) + 1
            : 1,
        title,
        author,
        publisher: publisher || 'Unknown',
        genre: genre || 'Unknown',
        releaseYear: releaseYear !== undefined ? Number(releaseYear) || null : null,
        volumes: volumes !== undefined ? Number(volumes) || 0 : 0,
        status: status || 'Unknown',
    };
    data.comics.push(newComic);
    if (writeComicsData(data)) {
        res.status(201).json({
            message: 'Comic successfully added',
            data: newComic,
        });
    }
    else {
        res.status(500).json({ message: 'Failed to save comic data' });
    }
});
// PUT update comic
app.put('/api/comics/:id', (req, res) => {
    const data = readComicsData();
    const comicIndex = data.comics.findIndex((c) => c.id === parseInt(req.params.id));
    if (comicIndex === -1) {
        res.status(404).json({ message: 'Comic not found' });
        return;
    }
    const { title, author, publisher, genre, releaseYear, volumes, status, } = req.body;
    data.comics[comicIndex] = Object.assign(Object.assign({}, data.comics[comicIndex]), { title: title || data.comics[comicIndex].title, author: author || data.comics[comicIndex].author, publisher: publisher || data.comics[comicIndex].publisher, genre: genre || data.comics[comicIndex].genre, releaseYear: releaseYear !== undefined
            ? Number(releaseYear) || null
            : data.comics[comicIndex].releaseYear, volumes: volumes !== undefined ? Number(volumes) || 0 : data.comics[comicIndex].volumes, status: status || data.comics[comicIndex].status });
    if (writeComicsData(data)) {
        res.json({
            message: 'Comic successfully updated',
            data: data.comics[comicIndex],
        });
    }
    else {
        res.status(500).json({ message: 'Failed to save comic data' });
    }
});
// DELETE comic
app.delete('/api/comics/:id', (req, res) => {
    const data = readComicsData();
    const comicIndex = data.comics.findIndex((c) => c.id === parseInt(req.params.id));
    if (comicIndex === -1) {
        res.status(404).json({ message: 'Comic not found' });
        return;
    }
    const deletedComic = data.comics[comicIndex];
    data.comics.splice(comicIndex, 1);
    if (writeComicsData(data)) {
        res.json({
            message: 'Comic successfully deleted',
            data: deletedComic,
        });
    }
    else {
        res.status(500).json({ message: 'Failed to save comic data' });
    }
});
// Middleware error handler
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'An error occurred!',
        error: err.message,
    });
});
// Handling uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
app.listen(port, () => {
    console.log(`Comic server running at http://localhost:${port}`);
});
