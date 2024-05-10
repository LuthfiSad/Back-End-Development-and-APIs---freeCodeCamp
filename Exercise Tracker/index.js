const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const { connect, model, Schema } = require('mongoose');

require('dotenv').config();

//* Middleware

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//* MongoDB

connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

//* Schemas

const exerciseSchema = new Schema({
	userId: String,
	username: String,
	description: { type: String, required: true },
	duration: { type: Number, required: true },
	date: String,
});

const userSchema = new Schema({
	username: String,
});

//* Models

const User = model('User', userSchema);

const Exercise = model('Exercise', exerciseSchema);

//* Endpoints

/*
 * GET
 * Delete all users
 */
app.get('/api/users/delete', async (_req, res) => {
	console.log('### delete all users ###'.toLocaleUpperCase());

	try {
		const result = await User.deleteMany({});
		res.json({ message: 'All users have been deleted!', result });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Deleting all users failed!' });
	}
});

/*
 * GET
 * Delete all exercises
 */
app.get('/api/exercises/delete', async (_req, res) => {
	console.log('### delete all exercises ###'.toLocaleUpperCase());

	try {
		const result = await Exercise.deleteMany({});
		res.json({ message: 'All exercises have been deleted!', result });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Deleting all exercises failed!' });
	}
});

app.get('/', async (_req, res) => {
	res.sendFile(__dirname + '/views/index.html');
	await User.syncIndexes();
	await Exercise.syncIndexes();
});

/*
 * GET
 * Get all users
 */
app.get('/api/users', async (_req, res) => {
	console.log('### Get All Users ###'.toUpperCase());

	try {
		const users = await User.find({});
		if (users.length === 0) {
			return res.status(404).json({ message: 'There are no users in the database!' });
		}

		console.log('Users in database:'.toUpperCase(), users.length);

		const formattedUsers = users
			.filter(user => user._id && user.username)
			.map(user => ({ _id: user._id, username: user.username }));

		res.json(formattedUsers);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Getting all users failed!' });
	}
});

/*
 * POST
 * Create a new user
 */
app.post('/api/users', async (req, res) => {
	const inputUsername = req.body.username;

	console.log('### create a new user ###'.toLocaleUpperCase());

	try {
		const newUser = new User({ username: inputUsername });
		await newUser.save();
		res.json({ username: newUser.username, _id: newUser._id });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'User creation failed!' });
	}
});

/*
 * POST
 * Add a new exercise
 * @param _id
 */
app.post('/api/users/:_id/exercises', async (req, res) => {
	const userId = req.params._id;
	let { description, duration, date } = req.body; // Ubah const menjadi let

	console.log('### add a new exercise ###'.toLocaleUpperCase());

	try {
		if (!date) {
			date = new Date().toISOString().substring(0, 10);
		}

		console.log('looking for user with id ['.toLocaleUpperCase() + userId + '] ...');

		const userInDb = await User.findById(userId);

		const newExercise = new Exercise({
			userId: userInDb._id,
			username: userInDb.username,
			description: description,
			duration: parseInt(duration),
			date: date,
		});

		await newExercise.save();
		res.json({
			username: userInDb.username,
			description: newExercise.description,
			duration: newExercise.duration,
			date: new Date(newExercise.date).toDateString(),
			_id: userInDb._id,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Exercise creation failed!' });
	}
});

/*
 * GET
 * Get a user's exercise log
 * @param _id
 */
app.get('/api/users/:_id/logs', async (req, res) => {
	const userId = req.params._id;
	let from = req.query.from || new Date(0).toISOString().substring(0, 10); // Ubah const menjadi let
	let to = req.query.to || new Date(Date.now()).toISOString().substring(0, 10); // Ubah const menjadi let
	let limit = Number(req.query.limit) || 0; // Ubah const menjadi let

	console.log('### get the log from a user ###'.toLocaleUpperCase());

	try {
		const user = await User.findById(userId);

		console.log('looking for exercises with id ['.toLocaleUpperCase() + userId + '] ...');

		const exercises = await Exercise.find({
			userId: userId,
			date: { $gte: from, $lte: to },
		})
			.select('description duration date')
			.limit(limit);

		const parsedDatesLog = exercises.map((exercise) => ({
			description: exercise.description,
			duration: exercise.duration,
			date: new Date(exercise.date).toDateString(),
		}));

		res.json({
			_id: user._id,
			username: user.username,
			count: parsedDatesLog.length,
			log: parsedDatesLog,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Getting user exercises failed!' });
	}
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port);
});
