const Portfolio = require('../models/portfolio');
const Category = require('../models/category');
const Tag = require('../models/tag');
const User = require('../models/user');
const formidable = require('formidable');
const slugify = require('slugify');
const stripHtml = require('string-strip-html');
const _ = require('lodash');
const { errorHandler } = require('../helpers/dbErrorHandler');
const fs = require('fs');
const { smartTrim } = require('../helpers/blog');

exports.create = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Image cant upload'
            });
        }

        const { title, body, categories, tags } = fields;

        if (!title || !title.length) {
            return res.status(400).json({
                error: 'title is needed'
            });
        }

        if (!body || body.length < 200) {
            return res.status(400).json({
                error: 'Content is too short'
            });
        }

        if (!categories || categories.length === 0) {
            return res.status(400).json({
                error: 'At least one category is needed here'
            });
        }

        if (!tags || tags.length === 0) {
            return res.status(400).json({
                error: 'At least one tag is needed here'
            });
        }

        let portfolio = new Portfolio();
        portfolio.title = title;
        portfolio.body = body;
        portfolio.excerpt = smartTrim(body, 320, ' ', ' ...');
        portfolio.slug = slugify(title).toLowerCase();
        portfolio.mtitle = `${title} | ${process.env.APP_NAME}`;
        portfolio.mdesc = stripHtml(body.substring(0, 160));
        portfolio.postedBy = req.user._id;
        
        let arrayOfCategories = categories && categories.split(',');
        let arrayOfTags = tags && tags.split(',');

        if (files.photo) {
            if (files.photo.size > 10000000) {
                return res.status(400).json({
                    error: 'yo the image should be less then 1MB in size'
                });
            }
            portfolio.photo.data = fs.readFileSync(files.photo.path);
            portfolio.photo.contentType = files.photo.type;
        }

        portfolio.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            // res.json(result);
            Portfolio.findByIdAndUpdate(result._id, { $push: { categories: arrayOfCategories } }, { new: true }).exec(
                (err, result) => {
                    if (err) {
                        return res.status(400).json({
                            error: errorHandler(err)
                        });
                    } else {
                        Portfolio.findByIdAndUpdate(result._id, { $push: { tags: arrayOfTags } }, { new: true }).exec(
                            (err, result) => {
                                if (err) {
                                    return res.status(400).json({
                                        error: errorHandler(err)
                                    });
                                } else {
                                    res.json(result);
                                }
                            }
                        );
                    }
                }
            );
        });
    });
};


exports.list = (req, res) => {
    Portfolio.find({})
        .populate('categories', '_id name slug')
        .populate('tags', '_id name slug')
        .populate('postedBy', '_id name username')
        .select('_id title slug excerpt categories tags postedBy createdAt updatedAt')
        .exec((err, data) => {
            if (err) {
                return res.json({
                    error: errorHandler(err)
                });
            }
            res.json(data);
        });
};

exports.listAllPortfoliosCategoriesTags = (req, res) => {
    let limit = req.body.limit ? parseInt(req.body.limit) : 10;
    let skip = req.body.skip ? parseInt(req.body.skip) : 0;

    let portfolios;
    let categories;
    let tags;

    Portfolio.find({})
        .populate('categories', '_id name slug')
        .populate('tags', '_id name slug')
        .populate('postedBy', '_id name username profile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('_id title slug excerpt categories tags postedBy createdAt updatedAt')
        .exec((err, data) => {
            if (err) {
                return res.json({
                    error: errorHandler(err)
                });
            }
            portfolios = data; 

            // get all categories
            Category.find({}).exec((err, c) => {
                if (err) {
                    return res.json({
                        error: errorHandler(err)
                    });
                }
                categories = c; // categories
                // get all tags
                Tag.find({}).exec((err, t) => {
                    if (err) {
                        return res.json({
                            error: errorHandler(err)
                        });
                    }
                    tags = t;
                    res.json({ portfolios, categories, tags, size: portfolios.length });
                });
            });
        });
};

exports.read = (req, res) => {
    const slug = req.params.slug.toLowerCase();
    Portfolio.findOne({ slug })
        .populate('categories', '_id name slug')
        .populate('tags', '_id name slug')
        .populate('postedBy', '_id name username')
        .select('_id title body slug mtitle mdesc categories tags postedBy createdAt updatedAt')
        .exec((err, data) => {
            if (err) {
                return res.json({
                    error: errorHandler(err)
                });
            }
            res.json(data);
        });
};

exports.remove = (req, res) => {
    const slug = req.params.slug.toLowerCase();
    Portfolio.findOneAndRemove({ slug }).exec((err, data) => {
        if (err) {
            return res.json({
                error: errorHandler(err)
            });
        }
        res.json({
            message: 'Portfolio deleted successfully'
        });
    });
};

exports.update = (req, res) => {
    const slug = req.params.slug.toLowerCase();

    Portfolio.findOne({ slug }).exec((err, oldPortfolio) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }

        let form = new formidable.IncomingForm();
        form.keepExtensions = true;

        form.parse(req, (err, fields, files) => {
            if (err) {
                return res.status(400).json({
                    error: 'Image could not upload'
                });
            }

            let slugBeforeMerge = oldPortfolio.slug;
            oldPortfolio = _.merge(oldPortfolio, fields);
            oldPortfolio.slug = slugBeforeMerge;

            const { body, desc, categories, tags } = fields;

            if (body) {
                oldPortfolio.excerpt = smartTrim(body, 320, ' ', ' ...');
                oldPortfolio.desc = stripHtml(body.substring(0, 160));
            }

            if (categories) {
                oldPortfolio.categories = categories.split(',');
            }

            if (tags) {
                oldPortfolio.tags = tags.split(',');
            }

            if (files.photo) {
                if (files.photo.size > 10000000) {
                    return res.status(400).json({
                        error: 'Image should be less then 1mb in size'
                    });
                }
                oldPortfolio.photo.data = fs.readFileSync(files.photo.path);
                oldPortfolio.photo.contentType = files.photo.type;
            }

            oldPortfolio.save((err, result) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                    });
                }
                // result.photo = undefined;
                res.json(result);
            });
        });
    });
};

exports.photo = (req, res) => {
    const slug = req.params.slug.toLowerCase();
    Portfolio.findOne({ slug })
        .select('photo')
        .exec((err, portfolio) => {
            if (err || !portfolio) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.set('Content-Type', portfolio.photo.contentType);
            return res.send(portfolio.photo.data);
        });
};

exports.listRelated = (req, res) => {
    let limit = req.body.limit ? parseInt(req.body.limit) : 3;
    const { _id, categories } = req.body.portfolio;

    Portfolio.find({ _id: { $ne: _id }, categories: { $in: categories } })
        .limit(limit)
        .populate('postedBy', '_id name username profile')
        .select('title slug excerpt postedBy createdAt updatedAt')
        .exec((err, portfolios) => {
            if (err) {
                return res.status(400).json({
                    error: 'Portfolio not found'
                });
            }
            res.json(portfolios);
        });
};

//
exports.listSearch = (req, res) => {
    console.log(req.query);
    const { search } = req.query;
    if (search) {
        Portfolio.find(
            {
                $or: [{ title: { $regex: search, $options: 'i' } }, { body: { $regex: search, $options: 'i' } }]
            },
            (err, portfolios) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                    });
                }
                res.json(portfolios);
            }
        ).select('-photo -body');
    }
};

exports.listByUser = (req, res) => {
    User.findOne({ username: req.params.username }).exec((err, user) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        let userId = user._id;
        Portfolio.find({ postedBy: userId })
            .populate('categories', '_id name slug')
            .populate('tags', '_id name slug')
            .populate('postedBy', '_id name username')
            .select('_id title slug postedBy createdAt updatedAt')
            .exec((err, data) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                    });
                }
                res.json(data);
            });
    });
};
