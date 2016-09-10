'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var utils = require('./utils');
var assertDuplicateFailure = utils.assertDuplicateFailure;
var wait = utils.wait;
var beautifulValidation = require('../');

mongoose.plugin(beautifulValidation);

test('should report duplicates', function (assert) {
    var DuplicateSchema = new Schema({
        address: {
            type: String,
            unique: true
        }
    });

    var Duplicate = mongoose.model('Duplicate', DuplicateSchema);

    assertDuplicateFailure(assert, function (doc) {
        return new Duplicate(doc).save();
    }, {
        address: '123 Fake St.'
    });
});

test('should report duplicates with Model.create()', function (assert) {
    var CreateSchema = new Schema({
        address: {
            type: String,
            unique: true
        }
    });

    var Create = mongoose.model('Create', CreateSchema);

    assertDuplicateFailure(assert, function (doc) {
        return Create.create(doc);
    }, {
        address: '123 Fake St.'
    });
});

test('should report duplicates with Model.findOneAndUpdate()', function (assert) {
    var FoauSchema = new Schema({
        address: {
            type: String,
            unique: true
        }
    });

    var Foau = mongoose.model('Foau', FoauSchema);

    // create an initial instance
    new Foau({
        address: '123 Fake St.'
    }).save().then(function () {
        return wait(500);
    }).then(function () {
        // save another document that does not violate the unique constraint
        new Foau({
            address: '321 Fake St.'
        }).save().then(function () {
            return wait(500);
        }).then(function () {
            // find the non-duplicate document and update it to become a dup
            Foau.findOneAndUpdate({
                address: '321 Fake St.'
            }, {
                address: '123 Fake St.'
            }).exec().then(function () {
                console.log(arguments);
                assert.fail('should not update duplicate successfully');
                assert.end();
            }, function (err) {
                assert.ok(err, 'err should exist');
                assert.equal(err.name, 'ValidationError', 'outer err should be of type ValidationError');
                assert.end();
            });
        });
    }, function (err) {
        assert.error(err, 'should save original instance successfully');
        assert.end();
    });
});

test('should report duplicates on fields containing spaces', function (assert) {
    var SpacesSchema = new Schema({
        'display name': {
            type: String,
            unique: true
        }
    });

    var Spaces = mongoose.model('Spaces', SpacesSchema);

    assertDuplicateFailure(assert, function (doc) {
        return new Spaces(doc).save();
    }, {
        'display name': 'Testing display names'
    });
});

test('should report duplicates on compound indexes', function (assert) {
    var CompoundSchema = new Schema({
        name: String,
        age: Number
    });

    CompoundSchema.index({
        name: 1,
        age: 1
    }, {
        unique: true
    });

    var Compound = mongoose.model('Compound', CompoundSchema);

    assertDuplicateFailure(assert, function (doc) {
        return new Compound(doc).save();
    }, {
        name: 'John Doe',
        age: 42
    });
});

test('should report duplicates with the custom validation message', function (assert) {
    var MessageSchema = new Schema({
        address: {
            type: String,
            unique: 'this is our custom message!'
        }
    });

    var Message = mongoose.model('Message', MessageSchema);

    assertDuplicateFailure(assert, function (doc) {
        return new Message(doc).save();
    }, {
        address: '123 Fake St.'
    }, 'this is our custom message!');
});

test('should report duplicates on compound indexes with the custom validation message', function (assert) {
    var CompoundMessageSchema = new Schema({
        name: String,
        age: Number
    });

    CompoundMessageSchema.index({
        name: 1,
        age: 1
    }, {
        unique: 'yet another custom message'
    });

    var CompoundMessage = mongoose.model('CompoundMessage', CompoundMessageSchema);

    assertDuplicateFailure(assert, function (doc) {
        return new CompoundMessage(doc).save();
    }, {
        name: 'John Doe',
        age: 42
    }, 'yet another custom message');
});

test('should report duplicates on any mongoose type', function (assert) {
    var AnyTypeSchema = new Schema({
        name: String,
        group: Schema.Types.ObjectId,
        age: Number,
        date: Date,
        blob: Buffer,
        isVerified: Boolean,
        list: []
    });

    AnyTypeSchema.index({
        name: 1,
        group: 1,
        age: 1,
        date: 1,
        blob: 1,
        isVerified: 1,
        list: 1
    }, {
        unique: true
    });

    var AnyType = mongoose.model('AnyType', AnyTypeSchema);

    assertDuplicateFailure(assert, function (doc) {
        return new AnyType(doc).save();
    }, {
        name: 'test',
        group: new mongoose.Types.ObjectId,
        age: 42,
        date: new Date,
        blob: new Buffer('abc'),
        isVerified: false,
        list: [1, 2, 3]
    });
});
