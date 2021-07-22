var app = angular.module('plunker', []);

app.controller('MainCtrl', ['$scope', '$http', function($scope, $http, $filter){
  //flags that jump between pages
  $scope.showLogin = true;
  $scope.show_student_page = false;
  $scope.show_lecturer_page = false;
  $scope.show_course_directory = false;
  $scope.show_course_on_offer = false; 
  $scope.show_to_do_list = false;
  $scope.show_my_courses_lec = false; 
  $scope.show_my_courses_stu = false; 
  $scope.show_edit_form = false;
  $scope.show_edit_form_A = false;
  $scope.show_add_Assignment = false;
  $scope.mark_completed;

  //-----------Data----------------
 
  /*
    Data source GET (links to all JSON files)
  **/
  $scope.user_list_link = "https://caab.sim.vuw.ac.nz/api/fanbaiw/user_list.json";

  $scope.course_list_link = "https://caab.sim.vuw.ac.nz/api/fanbaiw/course_directory.json";

  $scope.assignment_list_link = "https://caab.sim.vuw.ac.nz/api/fanbaiw/assignment_directory.json";

  $scope.student_course_list_link = "https://caab.sim.vuw.ac.nz/api/fanbaiw/course_association_directory.json";

  /*
    Data source POST 
  **/
  $scope.post_course = "https://caab.sim.vuw.ac.nz/api/fanbaiw/update.course_directory.json";
  $scope.post_assignment = "https://caab.sim.vuw.ac.nz/api/fanbaiw/update.assignment_directory.json";
  $scope.post_course_association = "https://caab.sim.vuw.ac.nz/api/fanbaiw/update.course_association_directory.json";

  
  /*
    Datasets (variables that stores the data)
  **/
  var user_list;
  $scope.course_list;
  $scope.assignment_list;
  $scope.student_course_list;
  $scope.user_detail;  // logged-in-user information
  $scope.lecturer_courses = []; // courses that a lecturer user teach
  $scope.student_courses = []; // courses that a student user has


  /*
    Read datas from all the JSON files via the data source link and 
    store the datasets into local variables
  **/

  //load users list
  $http.get($scope.user_list_link)
    .then(function(response) { 
        user_list = response.data.users; 
        //alert(JSON.stringify(user_list));
      }, function errorCall(){
        alert("Load userlist failed");
      }
      );
  
  //load courses list
  $http.get($scope.course_list_link)
  .then(function(response) { 
      $scope.course_list = response.data.courses; 
      //alert(JSON.stringify($scope.course_list));
    }, function errorCall(){
      alert("Load course list failed");
    }
    );

  //load assignments list
  $http.get($scope.assignment_list_link)
  .then(function(response) { 
      $scope.assignment_list = response.data.assignments; 
      //alert(JSON.stringify($scope.assignment_list));
    }, function errorCall(){
      alert("Load course list failed");
    }
    );

  //load students selected courses list
  $http.get($scope.student_course_list_link)
  .then(function(response) { 
      $scope.student_course_list = response.data.courseAssociations; 
      //alert(JSON.stringify($scope.student_course_list));
    }, function errorCall(){
      alert("Load course list failed");
    }
    );



  //  -------------Below are all the Functions----------------

  /*
    (Login validation)
    Check userinput and validate the combination from database
  **/
  $scope.loginValidator = function(){
    // check for empty input
    if(!$scope.username || !$scope.password){
        alert("Please enter username or password");
        return;
      }

    //check for unselected login type
    if(!$scope.button_check_lec && !$scope.button_check_stu){
      alert("Please select login type")
      return;
    }

    //user only can select one login type
    if($scope.button_check_lec && $scope.button_check_stu){
      alert("You only can select one login format")
      $scope.username = null;
      $scope.password = null;
      $scope.button_check_lec = null;
      $scope.button_check_stu = null;
      return;
    }

    //check for correct combination of username and password
    for(var i = 0; i < user_list.length; i++){
      var user_id = user_list[i].ID;
      var login_name = user_list[i].LoginName;
      var pass_word = user_list[i].Password;
      var user_type = user_list[i].UserType;

      if(login_name == $scope.username && pass_word == $scope.password){
        //lecture login, button matches type
        if($scope.button_check_lec && user_type =="lecturer"){
          alert("You have successfully logged in.");
          $scope.showLogin = false;
          $scope.show_lecturer_page = true;

          //------store user detail-----
          $scope.user_detail = {
            ID: user_id, 
            UserType: user_type,  
          };

          //alert($scope.user_detail.UserType);

          //------find the courses lecturer is teaching-----
          for(var i = 0; i < $scope.course_list.length; i++){

            var course_name = $scope.course_list[i].ID;
            var lecturer_id = $scope.course_list[i].LecturerID;

            if (lecturer_id == $scope.user_detail.ID){
              $scope.lecturer_courses.push(course_name);
            }
            //alert(JSON.stringify($scope.lecturer_courses));
          }
          return;
        }

        //student login, button matches type
        else if($scope.button_check_stu && user_type =="student"){
          alert("You have successfully logged in.");
          $scope.showLogin = false;
          $scope.show_student_page = true;

          //store user detail
          $scope.user_detail = {
            ID: user_id, 
            UserType: user_type,  
          };

          //alert(JSON.stringify($scope.user_detail));

          //------find the courses this student user has-----
          for(var i = 0; i < $scope.student_course_list.length; i++){
            
            var course_name = $scope.student_course_list[i].CourseID;  
            var student_id = $scope.student_course_list[i].StudentID; 

            if (student_id == $scope.user_detail.ID){
              $scope.student_courses.push(course_name);
            }
          }
          //alert(JSON.stringify($scope.student_courses));          
          return;
        }

        //button does not match type
        else{
          alert("You selected wrong login type");
          $scope.button_check_lec = null;
          $scope.button_check_stu = null;
          return;
        }
      }
    }

    //no match fund in database
    $scope.errorstyle = {"opacity": "1"};
    $scope.button_check_lec = null;
    $scope.button_check_stu = null;
  }

  //-----------------Course directory functions---------------------

  /*
    Allow only Lecturer to create a new course and post it into the database
  **/
  $scope.postCourse = function(){
    // Create the course object to post.
    var courseObj = {
      ID: $scope.courseID_input, 
      Name: $scope.course_name_input,  
      Overview: $scope.course_overview_input,
      Year: $scope.year_input,
      Trimester: $scope.trimester_input, 
      LectureTimes: $scope.lecture_time_input, 
      LecturerID: $scope.lecturerID_input,
    };

    $http.post($scope.post_course , courseObj)
      .then(function successCall(data, status, headers, config){
        alert("Posted Sucessfully");
     }, function errorCall(data, status, headers, config){
       alert("Failed to post");
     });
  }

  /*
  Allow student users add a course into their directory  
  **/
  $scope.addCourse = function(course){
    if($scope.user_detail.UserType == "student"){
      var associationID = $scope.student_course_list.length;
     
     associationObj = {
       ID: associationID,
       StudentID:$scope.user_detail.ID,
       CourseID: course.ID
     }

      $http.post($scope.post_course_association,associationObj)
      .then(function successCall(data, status, headers, config){
        alert("Course added Sucessfully");
      }, function errorCall(data, status, headers, config){
        alert("Failed to add course");
      });
    }
    else{
      alert("Only student can add course to their own directory")
    }
  }

  /*
  Display a form for creating a new course on course directory page 
  **/
  var coll = document.getElementsByClassName("modifybutton");
  var i;
  for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
      if($scope.user_detail.UserType == "student"){
        alert("Student cannot add new course!")
        return;
        }
      this.classList.toggle("active");
      var content = this.nextElementSibling;
      if (content.style.display === "block") {
        content.style.display = "none";
      } else {
        content.style.display = "block";
      }
    });
  }


//----------------------------filter functions---------------------
  /*(Lecturer my courses page)
    filter function that find the courses lecturer teach
  **/
  $scope.lecturerCourseFilter = function (course) { 
    if(course.LecturerID == $scope.user_detail.ID){
      return true;
    }
    else{
      return false;
    }
  };

  /*(Lecturer my courses page)
    filter function that finds the assignments lecturer have among all of the courses he is currently teaching
  **/
  $scope.lecturerAssignmentFilter = function(assignment){
    if($scope.lecturer_courses.includes(assignment.CourseID)){
      return true;
    }
    else{
      return false;
    }
  
  }

  /*(Student my courses page)
    filter function that finds the course this user has
  **/
  $scope.studentCourseFilter = function (course){
    return $scope.student_courses.includes(course.ID)
  }

  /*(Student my courses page)
    filter function that finds the course this user has
  **/
  $scope.studentAssignmentFilter = function(assignment){
    if($scope.student_courses.includes(assignment.CourseID)){
      return true;
    }
    else{
      return false;
    }
  }

  //-----------------My courses functions---------------------

  /*(Lecturer my courses page)
    Display the Course edit form and the current info of the "clicked" course
  **/
  $scope.editCourse = function(course){
    if($scope.show_edit_form){
      $scope.show_edit_form = false;
    }
    else{
      $scope.show_edit_form = true;
    }
    $scope.editCourseID = course.ID;
    $scope.editCourseName = course.Name;
    $scope.editCourseOverview = course.Overview;
    $scope.editCourseYear = course.Year;
    $scope.editCourseTrimester = course.Trimester; 
    $scope.editCourseLectureTimes = course.LectureTimes; 
    $scope.editCourseLecturerID = course.LecturerID;

  }

  /*(Lecturer my courses page)
  Post the content of course edit form to server
  **/
  $scope.editPostCourse = function(){
    // Create the course object to post. 
    var courseObj = {
      ID: $scope.editCourseID, 
      Name: $scope.editCourseName,  
      Overview: $scope.editCourseOverview,
      Year: $scope.editCourseYear,
      Trimester: $scope.editCourseTrimester, 
      LectureTimes: $scope.editCourseLectureTimes, 
      LecturerID: $scope.editCourseLecturerID,
    };

    $http.post($scope.post_course, courseObj)
      .then(function successCall(data, status, headers, config){
        alert("Posted Sucessfully");
     }, function errorCall(data, status, headers, config){
        alert("Failed to post");
     });
  }


  /*(Lecturer my courses page)
  Display the Assignment edit form and the current info of the "clicked" assignment
  **/
  $scope.editAssignment = function(assignment){
    if($scope.show_edit_form_A ){
      $scope.show_edit_form_A = false;
    }
    else{
      $scope.show_edit_form_A = true;
    }
    $scope.editAssignmentID = assignment.ID;
    $scope.editACourseID = assignment.CourseID;
    $scope.editAssignmentName = assignment.Name;
    $scope.editAssignmentOverview = assignment.Overview;
    $scope.editAssinmentDueDate = assignment.DueDate;
  }

  /*(Lecturer my courses page)
  Post the content of assignment edit form to server
  **/
  $scope.editPostAssignment = function(){
    // Create the course object to post. 
    var assignmentObj = {
      ID: $scope.editAssignmentID, 
      Name: $scope.editAssignmentName,  
      Overview: $scope.editAssignmentOverview,
      CourseID: $scope.editACourseID,
      DueDate: $scope.editAssinmentDueDate, 
    };

    $http.post($scope.post_assignment, assignmentObj)
      .then(function successCall(data, status, headers, config){
        alert("Posted Sucessfully");
     }, function errorCall(data, status, headers, config){
        alert("Failed to post");
     });
  }


  /*(Lecturer my courses page)
  Display the Assignment adding form 
  **/
  $scope.addAssignment = function(course){
    if($scope.show_add_Assignment){
      $scope.show_add_Assignment = false;
    }
    else{
      $scope.show_add_Assignment = true;
    }

    $scope.addAssignmentID = "*please enter details*";
    $scope.addACourseID = course.ID;
    $scope.addAssignmentName = "*please enter details*";
    $scope.addAssignmentOverview = "*please enter details*";
    $scope.addAssinmentDueDate = "*please enter details*";
  }

  /*(Lecturer my courses page)
  Create a new assignment for a course. Post the content of assignment adding form to server
  **/
  $scope.addPostAssignment = function(){
    // Create the course object to post. 
    var assignmentObj = {
      ID: $scope.addAssignmentID, 
      Name: $scope.addAssignmentName,  
      Overview: $scope.addAssignmentOverview,
      CourseID: $scope.addACourseID,
      DueDate: $scope.addAssinmentDueDate, 
    };

    $http.post($scope.post_assignment, assignmentObj)
      .then(function successCall(data, status, headers, config){
        alert("Posted Sucessfully");
     }, function errorCall(data, status, headers, config){
        alert("Failed to post");
     });
  }

  /*(Lecturer my courses page)
  Delete a assignment of a course from "my courses" page 
  **/
  $scope.deleteAssignment = function(assignment){
    if (confirm("Do you want to delete this Assignment ?")) {

      var assignmentObj = {
      ID: assignment.ID, 
      Name: assignment.Name,  
      Overview: assignment.Overview,
      CourseID: assignment.CourseID,
      DueDate: assignment.DueDate, 
      };

      var str0 = "https://caab.sim.vuw.ac.nz/api/fanbaiw/delete.assignment.{assignmentId}.json";
      var str1 = "https://caab.sim.vuw.ac.nz/api/fanbaiw/delete.assignment.";
      var str2 = assignment.ID;
      var str3 = ".json";
      var str_final = str1.concat(str2,str3);
      
      //alert(str_final);

      $http.delete(str_final, JSON.stringify(assignmentObj))
      .then(function successCall(data, status, headers, config){
        alert("Assignment deleted Sucessfully");
     }, function errorCall(data, status, headers, config){
        alert("Failed to delete Assignment");
     });
    } 

    else {
      alert("Canceled!");
    }

  }

  /*(Lecturer my courses page)
  Delete course from "my courses" page 
  **/
  $scope.deleteCourse = function(course){
    if (confirm("Do you want to delete this course ?")) {

      var courseObj = {
      ID: course.ID, 
      Name: course.Name,  
      Overview: course.Overview,
      Year: course.Year,
      Trimester: course.Trimester, 
      LectureTimes: course.LectureTimes, 
      LecturerID: course.LecturerID,
      };

      var str0 = "https://caab.sim.vuw.ac.nz/api/fanbaiw/delete.course.{courseId}.json";
      var str1 = "https://caab.sim.vuw.ac.nz/api/fanbaiw/delete.course.";
      var str2 = course.ID;
      var str3 = ".json";
      var str_final = str1.concat(str2,str3);
      //alert(str_final);

      $http.delete(str_final, JSON.stringify(courseObj))
      .then(function successCall(data, status, headers, config){
        alert("Course deleted Sucessfully");
     }, function errorCall(data, status, headers, config){
        alert("Failed to delete");
     });
    } 

    else {
      alert("Canceled!");
    }
  }

  /*(Student my courses page)
  Remove course from student's directory. 
  This function does not delete course, it only removes the course from student's directory which means they will not able to see this course in page my courses anymore.
  **/
  $scope.removeCourse = function (course){
    //find association id
    var temp_student_id = $scope.user_detail.ID; 
    var temp_course_id = course.ID;
    var associationID;

    for(var i = 0; i < $scope.student_course_list.length; i++){
      var student_id = $scope.student_course_list[i].StudentID;
      var course_id = $scope.student_course_list[i].CourseID;

      if(student_id == temp_student_id && course_id ==temp_course_id){
        associationID = $scope.student_course_list[i].ID;
      }
    }
    //alert(associationID);
    var associationObj = {
      ID: associationID,
      StudentID: temp_student_id,
      CourseID: temp_course_id
    }

    var str0 = "https://caab.sim.vuw.ac.nz/api/fanbaiw/delete.course_association.{courseAssociationId}.json";
    var str1 = "https://caab.sim.vuw.ac.nz/api/fanbaiw/delete.course_association.";
    var str2 = associationID;
    var str3 = ".json";
    var str_final = str1.concat(str2,str3);

    $http.delete(str_final, JSON.stringify(associationObj))
    .then(function successCall(data, status, headers, config){
      alert("Course removed Sucessfully");
    }, function errorCall(data, status, headers, config){
      alert("Failed to remove");
    });
  }

  $scope.completeAssignment = function(){
    $scope.mark_completed = "completed";
  }

  $scope.uncompleteAssignment = function(){
    $scope.mark_completed = " ";
  }


  //-----------------Other functions---------------------

  /*
  logout function, resets every flags
  **/
  $scope.logOut = function(){
    $scope.showLogin = true;
    $scope.show_student_page = false;
    $scope.show_lecturer_page = false;
    $scope.show_course_directory = false;
    $scope.show_course_on_offer = false;
    $scope.show_to_do_list = false;
    $scope.show_my_courses_lec = false;
    $scope.show_my_courses_stu = false
    $scope.errorstyle = {"opacity": "0"};
    $scope.button_check_lec = null;
    $scope.button_check_stu = null;
    $scope.username = null;
    $scope.password = null;
    $scope.lecturer_courses = [];

  }

  /*
  Secondary layer page jumping fuctions (all pages that are directed from welcome page)
  **/
  $scope.display_course_directory = function(){
    $scope.show_student_page = false;
    $scope.show_lecturer_page = false;
    $scope.show_course_directory = true;
  }

  $scope.display_my_courses_l = function(){
    $scope.show_student_page = false;
    $scope.show_lecturer_page = false;
    $scope.show_my_courses_lec = true;
  }

  $scope.display_my_courses_s = function(){
     $scope.show_student_page = false;
    $scope.show_lecturer_page = false;
    $scope.show_my_courses_stu = true;
  }

  $scope.display_course_offer = function(){
    $scope.show_student_page = false;
    $scope.show_course_on_offer = true;
  }

  $scope.display_to_do_list = function(){
    $scope.show_student_page = false;
    $scope.show_to_do_list = true;
  }

  /*
  redirect second layer pages back to welcome page
  **/
  $scope.redirectWelcome = function(){
    if($scope.user_detail.UserType == "student"){
        $scope.showLogin = false;
        $scope.show_student_page = true;
        $scope.show_lecturer_page = false;
        $scope.show_course_directory = false;
        $scope.show_course_on_offer = false;
        $scope.show_to_do_list = false;
        $scope.show_my_courses_lec = false; 
        $scope.show_my_courses_stu = false;
    }
    else{
        $scope.showLogin = false;
        $scope.show_student_page = false;
        $scope.show_lecturer_page = true;
        $scope.show_course_directory = false;
        $scope.show_course_on_offer = false;
        $scope.show_to_do_list = false;
        $scope.show_my_courses_lec = false; 
        $scope.show_my_courses_stu = false;

    }

  }

  /*
  Sort function for student's to do list page
  */
  $scope.sortTable = function(){
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("to_do_table");
    switching = true;

    while (switching) {
      switching = false;
      rows = table.rows;

      for (i = 1; i < (rows.length - 1); i++) {
        shouldSwitch = false;
        x = rows[i].getElementsByTagName("TD")[0];
        y = rows[i + 1].getElementsByTagName("TD")[0];
        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          shouldSwitch = true;
          break;
        }
      }

      if (shouldSwitch) {
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
      }
    }
  }
  //------------------functions end-----------------------

    }
  ]
);



