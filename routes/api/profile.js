const express = require('express')
const router = express.Router();
const auth = require('../../middleware/auth');
const {
    check,
    validationResult
} = require('express-validator')

const User = require('../../models/User');
const Profile = require('../../models/Profile');



router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({
                msg: 'There is no profile for this user'
            })
        }
        res.json(profile)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

// @route           POST api/profile/me
// @description     Create or update user profile 
// @access          Private 
router.post('/', [auth, [
        check('status', 'Status is required').not().isEmpty(),
        check('skills', 'SKills is required').not().isEmpty()
    ]],

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }
        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;

        //   build profile object
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim());

        }
        // Build social object
        profileFields.social = {}
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (instagram) profileFields.social.instagram = instagram;

        try {
            let profile = await Profile.findOne({
                user: req.user.id
            });

            if (profile) {
                // update
                profile = await Profile.findOneAndUpdate({
                    user: req.user.id
                }, {
                    $set: profileFields
                }, {
                    new: true
                });

                return res.json(profile);
            }

            // Create
            profile = new Profile(profileFields);

            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error')
        }
    }
);

// @route           POST api/profile/
// @description     GEt all profiles
// @access          Public 

router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})



// @route           Get api/profile/user/:user_id
// @description     Get profile by user ID
// @access          Private 

router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id
        }).populate('user', ['name', 'avatar']);
        if (!profile) return res.status(400).json({
            message: "Profile not Found"
        })

        res.json(profile)
    } catch (err) {
        console.error(err.message)
        if (err.kind == 'ObjectId') {
            return res.status(400).json({
                message: "Profile not found"
            });
        }
        res.status(500).send('Server Error')
    }
})

// @route           DELETE api/profile/
// @description     DELETE profile, user & posts
// @access          Private 

router.delete('/', auth, async (req, res) => {
    try {
        // @todo - remove users posts
        // Remove profile 
        await Profile.findOneAndRemove({
            user: req.user.id
        });
        // remove user
        await User.findOneAndRemove({
            _id: req.user.id
        });
        res.json({
            msg: 'User Deleted'
        })
    } catch (error) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})


module.exports = router;