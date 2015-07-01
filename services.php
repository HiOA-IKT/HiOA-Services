<?php
$log_dir = "/home/***REMOVED***/jmetertesting/logs/";
function reload() {
	$files = get_included_files();
	foreach($files as $file) {
		if (runkit_lint_file($file)) {
			runkit_import($file);
		} else {
			return false;
		}
	}
}
function print_file($file){
	$urls = array();
	$file = "/home/***REMOVED***/jmetertesting/logs/" . $file;
	$myfile = fopen($file, "r") or die("Unable to open file");
	while(!feof($myfile)){
		$urls[] = chop(fgets($myfile));
	}
	$urls = array_unique($urls);
	foreach($urls as $url){
		echo "<a href=\"" . $url . "\">" . $url . "</a><br />";
	}
	fclose($myfile);
}
function print_error($msg, $id){
	echo "<li>";
	echo "	<div class=\"error\" id=\"" . $id . "\">";
	echo "		" . $msg;
	echo "		<div class=\"status err-tag\">Error</div>";
	echo "	</div>";
	echo "	<div class=\"urls\">";
	print_file($msg);
	echo "		</div>";
	echo "</li>";
}
function first_err(){
	echo "			<div class=\"status err-tag\">Error</div>";
	echo "		</div>";
	echo "		<ul class=\"dropdown\">";
}
function print_login_services(){
	global $log_dir;
	$stat = "ok";
	$login_services = array("USER_UUID not set"=>"user-uuid-not-set", "Not login page"=>"loginpage", "Not logged in"=>"not-logged-in", "Logout failed"=>"logout");
	echo "	<div id=\"login-service\" class=\"service\">";
	echo "		<div class=\"title\">";
	echo "			Login Services";
	foreach ($login_services as $msg => $id){
		$file = $log_dir . $msg;
		if(file_exists($file)){
			if($stat == "ok"){
				$stat = "err";
				first_err();
			}
			print_error($msg, $id);
		}
	}
	if($stat == "ok"){
		echo "	<div class=\"status ok\">OK</div>";
		echo "	</div>";
		echo "</div>";
	}
	else{
		echo "	</ul>";
		echo "</div>";
	}
}
function print_course_services(){
	global $log_dir;
	$stat = "ok";
	$course_services=array("No bachelor courses found"=>"no-bach", "No master courses found"=>"no-master", "No one year courses found"=>"no-oneyr", "Unfinished bachelor course"=>"unf-bach", "Unfinished master course"=>"unf-master", "Unfinished one year course"=>"unf-oneyr", "Test user has no studies"=>"no-study");
	echo "	<div id=\"courses\" class=\"service\">";
	echo "		<div class=\"title\">";
	echo "			Courses";
	foreach ($course_services as $msg => $id){
		$file = $log_dir . $msg;
		if(file_exists($file)){
			if($stat == "ok"){
				$stat = "err";
				first_err();
			}
			print_error($msg, $id);
		}
	}
	if($stat == "ok"){
		echo "			<div class=\"status ok\">OK</div>";
		echo "		</div>";
		echo "</div>";
	}
	else{
		echo "	</ul>";
		echo "</div>";
	}
}
function print_info_services(){
	global $log_dir;
	$stat = "ok";
	$info_services = array("Error in NSD numbers"=>"nsd-nums", "hioa.mynetworkglobal.com is down"=>"mng-down", "Missing Google Maps"=>"gm-missing", "No connection to MNG"=>"mng-conn", "Search for christ failed"=>"chr-search", "Search for Høivik failed"=>"hoi-search", "Filtered search failed"=>"filt-search", "StudentWeb is down"=>"studweb-down", "Fronter is down"=>"fronter-down", "Outlook is down"=>"outlook-down", "Room reservation is down"=>"romres-down", "Inspera is down"=>"inspera-down");
	echo "	<div id=\"info\" class=\"service\">";
	echo "		<div class=\"title\">";
	echo "			Information";
	foreach ($info_services as $msg => $id){
		$file = $log_dir . $msg;
		if(file_exists($file)){
			if($stat == "ok"){
				$stat = "err";
				first_err();
			}
			print_error($msg, $id);
		}
	}
	if($stat == "ok"){
		echo "			<div class=\"status ok\">OK</div>";
		echo "		</div>";
		echo "</div>";
	}
	else{
		echo "	</ul>";
		echo "</div>";
	}
}
function print_solr_services(){
	global $log_dir;
	$stat = "ok";
	$solr_services = array("Error in solrdata publications"=>"solr-pub", "Solr connection does not exist"=>"solr-conn");
	echo "	<div id=\"solr\" class=\"service\">";
	echo "		<div class=\"title\">";
	echo "			Solr";
	foreach ($solr_services as $msg => $id){
		$file = $log_dir . $msg;
		if(file_exists($file)){
			if($stat == "ok"){
				$stat = "err";
				first_err();
			}
			print_error($msg, $id);
		}
	}
	if($stat == "ok"){
		echo "			<div class=\"status ok\">OK</div>";
		echo "		</div>";
		echo "</div>";
	}
	else{
		echo "	</ul>";
		echo "</div>";
	}
}
function print_profile_services(){
	global $log_dir;
	$stat = "ok";
	$profile_services = array("Cristin data does not exist"=>"cristin", "Christ is unemployed"=>"christ-unemp");
	echo "	<div id=\"profiles\" class=\"service\">";
	echo "		<div class=\"title\">";
	echo "			User Profiles";
	foreach ($profile_services as $msg => $id){
		$file = $log_dir . $msg;
		if(file_exists($file)){
			if($stat == "ok"){
				$stat = "err";
				first_err();
			}
			print_error($msg, $id);
		}
	}
	if($stat == "ok"){
		echo "			<div class=\"status ok\">OK</div>";
		echo "		</div>";
		echo "</div>";
	}
	else{
		echo "	</ul>";
		echo "</div>";
	}
}
echo "<div id=\"services\">";
print_login_services();
print_course_services();
print_info_services();
print_solr_services();
print_profile_services();
echo "</div>";
?>
