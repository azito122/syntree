<!DOCTYPE html>

<html>
    <?php include DOCROOT . '/head.php' ?>

    <body class="page_docs page_docs_requirements_list">
    	<?php print($R->back_button()); ?>
    	<?php print($R->download_button("requirements_list.rst")); ?>

        <?php include DOCROOT . '/docs/source/html/requirements_list_source.html' ?>

    </body>
</html>