    const mongoose = require('mongoose');

    const TournamentSchema = new mongoose.Schema(
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        slug: {
          type: String,
          unique: true,
          trim: true,
          lowercase: true,
        },
        description: {
          type: String,
          default: '',
          trim: true,
        },
        status: {
          type: String,
          enum: ['DRAFT', 'REGISTRATION', 'GROUP_STAGE', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL', 'COMPLETED', 'CANCELLED'],
          default: 'DRAFT',
        },
        currentStage: {
          type: String,
          enum: ['GROUP_STAGE', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'],
          default: 'GROUP_STAGE',
        },
        maxParticipants: {
          type: Number,
          default: 20,
          min: [1, 'Maximum participants must be at least 1'],
        },
        numberOfGroups: {
          type: Number,
          default: 4,
          min: [1, 'Number of groups must be at least 1'],
        },
        participantsPerGroup: {
          type: Number,
          min: [1, 'Participants per group must be at least 1'],
        },
        qualifiersPerGroup: {
          type: Number,
          min: [1, 'Qualifiers per group must be at least 1'],
        },
        // ✅ Added groupContests field
        groupContests: {
          type: Number,
          default: 1,
          min: [1, 'Group contests must be at least 1'],
        },
        playoffFormat: {
          type: String,
          enum: ['SINGLE_ELIMINATION'],
          default: 'SINGLE_ELIMINATION',
        },
        registrationStart: {
          type: Date,
        },
        registrationEnd: {
          type: Date,
        },
        tournamentStart: {
          type: Date,
        },
        tournamentEnd: {
          type: Date,
        },
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
      {
        timestamps: true,
      }
    );

    // Pre-validation middleware
    TournamentSchema.pre('validate', function() {
      // Calculate participantsPerGroup if not provided
      if (
        this.maxParticipants &&
        this.numberOfGroups &&
        !this.participantsPerGroup
      ) {
        this.participantsPerGroup =
          this.maxParticipants / this.numberOfGroups;
      }

      // Validate maxParticipants divisible by numberOfGroups
      if (this.maxParticipants && this.numberOfGroups) {
        if (this.maxParticipants % this.numberOfGroups !== 0) {
          throw new Error(
            'Maximum participants must be divisible by number of groups'
          );
        }
      }

      // Validate qualifiersPerGroup < participantsPerGroup
      if (this.qualifiersPerGroup && this.participantsPerGroup) {
        if (this.qualifiersPerGroup >= this.participantsPerGroup) {
          throw new Error(
            'Qualifiers per group must be less than participants per group'
          );
        }
      }

      // Validate dates
      if (this.registrationStart && this.registrationEnd) {
        if (this.registrationStart >= this.registrationEnd) {
          throw new Error(
            'Registration end must be after registration start'
          );
        }
      }

      if (this.registrationEnd && this.tournamentStart) {
        if (this.registrationEnd > this.tournamentStart) {
          throw new Error(
            'Tournament start must be after registration end'
          );
        }
      }

      if (this.tournamentStart && this.tournamentEnd) {
        if (this.tournamentStart >= this.tournamentEnd) {
          throw new Error(
            'Tournament end must be after tournament start'
          );
        }
      }

      // ✅ Validate groupContests
      if (this.groupContests !== undefined && this.groupContests !== null) {
        if (this.groupContests < 1) {
          throw new Error('Group contests must be at least 1');
        }
      }

      // Backward compatibility
      if (this.tournamentStart) {
        this.startDate = this.tournamentStart;
      }

      if (this.tournamentEnd) {
        this.endDate = this.tournamentEnd;
      }
    });

    // Generate slug from name before saving
    TournamentSchema.pre('save', function() {
      if (this.isModified('name') && this.name) {
        this.slug = this.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
    });

    module.exports = mongoose.model('Tournament', TournamentSchema);