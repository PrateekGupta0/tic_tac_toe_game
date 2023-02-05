// to create room

const mongoose =require('mongoose');
const playerSchema = require('./player');


//skeleton ofroom or schema


const roomSchema = new mongoose.Schema({
    occupancy:{//how many players can be in this room
        type:Number,
        default: 2,
    },

    maxRounds: {
        type:Number,
        default:5,
    },

    currentRound: {
        required: true,
        type:Number,
        default:1,
    },

    players: [playerSchema],
    isJoin: {
        type: Boolean,
        default: true,
    },
    turn: playerSchema,// who turn it is
    turnIndex: {
        type: Number,
        default: 0,
    }
});// it is just schema we need to model it
//because in database we store model
const roomModel =mongoose.model('Room',roomSchema); //converting into model whose name is Room

module.exports =roomModel;