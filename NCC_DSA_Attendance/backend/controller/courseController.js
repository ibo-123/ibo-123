const Course = require("../model/course.model");
const User = require("../model/user.model");

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("students", "name email role");
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getCourseById = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await Course.findById(id).populate("students", "name email role");
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

exports.createCourse = async (req, res) => {
  const { title, instructor, description } = req.body;

  if (!title || !instructor) {
    return res.status(400).json({ message: "Title and instructor are required." });
  }

  try {
    const course = new Course({ title, instructor, description });
    await course.save();
    res.status(201).json({ course, message: "Course created successfully." });
  } catch (error) {
    console.error("Error creating course:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

exports.enrollStudent = async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (course.students.some((studentId) => studentId.toString() === userId)) {
      return res.status(400).json({ message: "You are already enrolled in this course." });
    }

    course.students.push(userId);
    await course.save();

    await User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: courseId } });

    res.json({ message: "Enrolled successfully.", courseId });
  } catch (error) {
    console.error("Error enrolling student:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const { title, instructor, description } = req.body;

  try {
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    course.title = title || course.title;
    course.instructor = instructor || course.instructor;
    course.description = description || course.description;
    await course.save();

    res.json({ message: "Course updated successfully.", course });
  } catch (error) {
    console.error("Error updating course:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

exports.deleteCourse = async (req, res) => {
  const { id } = req.params;

  try {
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    await course.deleteOne();
    res.json({ message: "Course deleted successfully." });
  } catch (error) {
    console.error("Error deleting course:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};
