<?php
$log_dir = "/home/***REMOVED***/jmetertesting/logs/";
function print_file($cat, $msg){
	global $log_dir;
	$urls = array();
	$file = $log_dir . "/" . $cat . "/" . $msg;
	$myfile = fopen($file, "r") or die("Unable to open file: ".$file);
	while(!feof($myfile)){
		$urls[] = chop(fgets($myfile));
	}
	$urls = array_unique($urls);
	foreach($urls as $url){
		echo "<a href=\"" . $url . "\">" . $url . "</a><br />";
	}
	fclose($myfile);
}
function print_error($cat, $msg){
	echo "<li>";
	echo "	<div class=\"error\">";
	echo "		" . $msg;
	echo "		<div class=\"status err-tag\">Error</div>";
	echo "	</div>";
	echo "	<div class=\"urls\">";
	print_file($cat, $msg);
	echo "		</div>";
	echo "</li>";
}
function first_err(){
	echo "			<div class=\"status err-tag\">Error</div>";
	echo "		</div>";
	echo "		<ul class=\"dropdown\">";
}
function close_cat($stat){
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
function print_services(){
	global $log_dir;
	$services = array_diff(scandir($log_dir), array(".",".."));
	foreach($services as $d => $cat){
		$stat = "ok";
		echo "	<div id=\"".$cat."\" class=\"service\">";
		echo "		<div class=\"title\">";
		echo "			" . $cat;
		$dir = array_diff(scandir($log_dir.$cat), array(".",".."));
		foreach ($dir as $el => $msg){
			$file = $log_dir . "/" . $cat . "/" . $msg;
			if(file_exists($file)){
				if($stat == "ok"){
					$stat = "err";
					first_err();
				}
				print_error($cat, $msg);
			}
		}
		close_cat($stat);
	}
}
echo "<div id=\"services\">";
print_services();
//print_login_services();
//print_course_services();
//print_info_services();
//print_solr_services();
//print_profile_services();
echo "</div>";
?>
