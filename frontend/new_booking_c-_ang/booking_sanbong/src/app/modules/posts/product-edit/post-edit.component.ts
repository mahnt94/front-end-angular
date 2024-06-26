import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { ToastrService } from 'ngx-toastr';
import { ICategory } from 'src/app/interfaces/Category';
import { ImagePreview } from 'src/app/interfaces/Image';
import { IPosts } from 'src/app/interfaces/Product';
import { CategoryService } from 'src/app/services/category/category.service';
import { ProductsService } from 'src/app/services/products/products.service';
import { UploadImageService } from 'src/app/services/uploadImage/upload-image.service';
import { MyUploadAdapter } from '../myuploadAdapter';

@Component({
  selector: 'app-post-edit',
  templateUrl: './post-edit.component.html',
  styleUrls: ['./post-edit.component.scss'],
})
export class PostEditComponent implements AfterViewInit {
  tempFile: any;

  EditForm = this.builder.group({
    title: ['', [Validators.required, Validators.minLength(4)]],
    content: ['', [Validators.required]],
    address: ['', [Validators.required, Validators.minLength(4)]],
    images: [[''], [Validators.required]],
    author: [''],
    description: ['', [Validators.required]],
    category: ['', [Validators.required]],
    is_active: [''],
    status: ['', [Validators.required]],
    price: [0, [Validators.required]],
  });
  categories: ICategory[] = [];
  public Editor = ClassicEditor;
  public ContentPost!: IPosts;
  imagePreviews: ImagePreview[] = [];
  nextImageId = 0;
  urls: any[] = [];
  constructor(
    private postsService: ProductsService,
    private router: Router,
    private builder: FormBuilder,
    private toastr: ToastrService,
    private uploadImageService: UploadImageService,
    private http: HttpClient,
    private categoryService: CategoryService,

    private params: ActivatedRoute
  ) {
    this.getAllCategories();
    this.ngAfterViewInit();
  }

  ngAfterViewInit(): void {
    const id = this.params.snapshot.params['id'];
    this.postsService.getPostById(id).subscribe((data) => {
      console.log(data.data, 'dataid');
      console.log(data.data.name, 'dataid');
      console.log(data.data.address, 'dataid');
      console.log(data.data.description, 'dataid');
      console.log(data.data.status, 'dataid');

      this.EditForm.patchValue({
        title: data.data.name,
        address: data.data.address,
        price: data.data.price,
        content: data.data.description,
        status: data.data.status,
      });
    });
  }

  /* get data */
  getAllCategories() {
    this.categoryService.getAllCategories().subscribe((categories) => {
      this.categories = categories.data;
    });
  }

  handleFileInput(event: any): void {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      this.urls.push(files[i]);
    }
  }
  handleRemoveImage(public_id: string) {
    if (!public_id) return;
    this.uploadImageService.deleteImage(public_id).subscribe(() => {
      this.imagePreviews = this.imagePreviews.filter(
        (image) => image.public_id !== public_id
      );
    });
  }

  handleSubmitPostForm() {
    const id = this.params.snapshot.params['id'];
    /* lấy ra thông tin người dùng */
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user) {
      this.toastr.error('Bạn chưa đăng nhập');
      return;
    }

    const post = {
      id: id,
      title: this.EditForm.value.title,
      address: this.EditForm.value.address,
      price: this.EditForm.value.price,
      images: this.urls[0],
      Description: this.EditForm.value.content,
      status: this.EditForm.value.status,
    };

    const putData = new FormData();
    if (this.EditForm.value.title) {
      putData.append('Name', this.EditForm.value.title);
    }
    putData.append('Id', id);
    if (this.EditForm.value.content) {
      putData.append('Description', this.EditForm.value.content);
    }
    if (this.EditForm.value.address) {
      putData.append('Address', this.EditForm.value.address);
    }
    if (this.EditForm.value.price) {
      putData.append('price', this.EditForm.value.price.toString());
    }
    if (this.EditForm.value.status) {
      putData.append('status', this.EditForm.value.status);
    }
    putData.append('picture', this.urls[0]);

    this.postsService.updatePost(putData).subscribe(
      () => {
        this.toastr.success('Chỉnh sửa thành công');
        this.router.navigate(['/admin/manager-product']);
        this.EditForm.reset();
      },
      () => {
        this.toastr.error('Chỉnh sửa thất bại');
      }
    );
  }

  onEditorReady = (editor: any) => {
    editor.plugins.get('FileRepository').createUploadAdapter = (
      loader: any
    ) => {
      return new MyUploadAdapter(loader, this.http);
    };
  };
}
